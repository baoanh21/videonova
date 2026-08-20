import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  sid: string;
  email: string;
  role: Role;
  type: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.type !== 'access') throw new UnauthorizedException();
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      include: { user: { select: { isLocked: true } } },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.isLocked) {
      throw new UnauthorizedException('Session is no longer valid');
    }
    return { id: payload.sub, email: payload.email, role: payload.role, sessionId: payload.sid };
  }
}
