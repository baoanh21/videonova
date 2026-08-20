import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';

interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto, meta: RequestMeta) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email is already registered');
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.full_name.trim(),
        passwordHash: await bcrypt.hash(dto.password, 12),
      },
    });
    return this.issueTokens(user, meta);
  }

  async login(dto: LoginDto, meta: RequestMeta) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.isLocked) throw new UnauthorizedException('Account is locked');
    return this.issueTokens(user, meta);
  }

  async refresh(refreshToken: string, meta: RequestMeta) {
    let payload: { sub: string; sid: string; type: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.type !== 'refresh') throw new UnauthorizedException('Invalid refresh token');
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });
    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.tokenHash !== this.hashToken(refreshToken) ||
      session.user.isLocked
    ) {
      throw new UnauthorizedException('Refresh session is no longer valid');
    }
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(session.user, meta);
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    let developmentToken: string | undefined;
    if (user && !user.isLocked) {
      const token = randomBytes(32).toString('base64url');
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: this.hashToken(token),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });
      // A mail provider should deliver this in production. Returning it in development makes local testing possible.
      if (this.config.get('NODE_ENV') !== 'production') developmentToken = token;
    }
    return {
      message: 'If the account exists, password reset instructions have been created.',
      ...(developmentToken ? { reset_token: developmentToken } : {}),
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashToken(dto.token) },
    });
    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      throw new BadRequestException('Reset token is invalid or expired');
    }
    const passwordHash = await bcrypt.hash(dto.new_password, 12);
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (!claimed.count) throw new BadRequestException('Reset token is invalid or expired');
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash, passwordChangedAt: new Date() },
      });
      await tx.session.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await bcrypt.compare(dto.current_password, user.passwordHash))) {
      throw new BadRequestException('Current password is incorrect');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: await bcrypt.hash(dto.new_password, 12),
          passwordChangedAt: new Date(),
        },
      }),
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  private async issueTokens(user: User, meta: RequestMeta) {
    const expiresAt = new Date(
      Date.now() + this.config.get<number>('JWT_REFRESH_TTL_DAYS', 30) * 86_400_000,
    );
    const placeholder = randomBytes(32).toString('hex');
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: placeholder,
        expiresAt,
        ipAddress: meta.ip,
        userAgent: meta.userAgent?.slice(0, 500),
      },
    });
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, sid: session.id, role: user.role, email: user.email, type: 'access' },
      { expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m') as any },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, sid: session.id, type: 'refresh' },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: `${this.config.get<number>('JWT_REFRESH_TTL_DAYS', 30)}d`,
      },
    );
    await this.prisma.session.update({
      where: { id: session.id },
      data: { tokenHash: this.hashToken(refreshToken) },
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: this.config.get<string>('JWT_ACCESS_TTL', '15m'),
      user: this.publicUser(user),
    };
  }

  private publicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      display_name: user.displayName,
      phone: user.phone,
      language: user.language,
      role: user.role.toLowerCase(),
      is_locked: user.isLocked,
      credit_balance: user.creditBalance,
      created_at: user.createdAt,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
