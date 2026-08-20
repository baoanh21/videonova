import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { validateImageBuffer } from '../common/files/image-validation';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { DeleteAccountDto, UpdateProfileDto, UpdateSettingsDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.serialize(user);
  }

  async update(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.full_name?.trim(),
        displayName: dto.display_name?.trim(),
        phone: dto.phone?.trim(),
        language: dto.language,
      },
    });
    return this.serialize(user);
  }

  async uploadAvatar(userId: string, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('avatar is required');
    const detected = validateImageBuffer(file.buffer);
    const key = `avatars/${userId}/${randomUUID()}.${detected.ext}`;
    await this.storage.put(key, file.buffer);
    const previous = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarPath: key },
    });
    if (previous.avatarPath) await this.storage.delete(previous.avatarPath);
    return { ...this.serialize(user), avatar_url: `/api/v1/users/me/avatar` };
  }

  async avatar(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.avatarPath) throw new BadRequestException('Avatar is not set');
    const extension = extname(user.avatarPath).slice(1);
    return {
      buffer: await this.storage.read(user.avatarPath),
      mime: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
    };
  }

  async settings(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return {
      notifications: user.notificationSettings,
      low_credit_threshold: user.lowCreditThreshold,
      last_password_changed_at: user.passwordChangedAt,
    };
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        notificationSettings: { ...dto.notifications },
        lowCreditThreshold: dto.low_credit_threshold,
      },
    });
    return {
      notifications: user.notificationSettings,
      low_credit_threshold: user.lowCreditThreshold,
      last_password_changed_at: user.passwordChangedAt,
    };
  }

  async deleteAccount(userId: string, dto: DeleteAccountDto): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new BadRequestException('Password is incorrect');
    }
    await this.prisma.user.delete({ where: { id: userId } });
  }

  private serialize(user: any) {
    return {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      display_name: user.displayName,
      phone: user.phone,
      language: user.language,
      avatar_url: user.avatarPath ? '/api/v1/users/me/avatar' : null,
      role: user.role.toLowerCase(),
      credit_balance: user.creditBalance,
      is_locked: user.isLocked,
      created_at: user.createdAt,
    };
  }
}
