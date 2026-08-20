import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionStatus, TransactionType, VideoStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreditsService } from '../credits/credits.service';
import { PrismaService } from '../prisma/prisma.service';
import { VideosService } from '../videos/videos.service';
import { GrantCreditsDto, LockUserDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly videos: VideosService,
    private readonly credits: CreditsService,
  ) {}

  async dashboard() {
    const [users, videos, activeJobs, failedJobs, transactions, creditsUsed, recentJobs] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.video.count({ where: { deletedAt: null } }),
        this.prisma.videoJob.count({
          where: { status: { in: [VideoStatus.QUEUED, VideoStatus.PROCESSING] } },
        }),
        this.prisma.videoJob.count({ where: { status: VideoStatus.FAILED } }),
        this.prisma.creditTransaction.count(),
        this.prisma.creditTransaction.aggregate({
          where: { type: TransactionType.DEBIT, status: TransactionStatus.COMPLETED },
          _sum: { creditAmount: true },
        }),
        this.prisma.videoJob.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            video: { include: { user: { select: { id: true, email: true, fullName: true } } } },
          },
        }),
      ]);
    return {
      totals: {
        users,
        videos,
        active_jobs: activeJobs,
        failed_jobs: failedJobs,
        transactions,
        credits_used: Math.abs(creditsUsed._sum.creditAmount ?? 0),
      },
      recent_jobs: recentJobs.map((job) => ({
        id: job.id,
        video_id: job.videoId,
        status: job.status,
        attempts: job.attempts,
        error: job.errorDetail,
        created_at: job.createdAt,
        user: job.video.user,
      })),
    };
  }

  async users(query: PaginationDto) {
    const where: Prisma.UserWhereInput = query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: 'insensitive' } },
            { fullName: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          displayName: true,
          role: true,
          isLocked: true,
          creditBalance: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items: items.map((user) => ({
        ...user,
        full_name: user.fullName,
        display_name: user.displayName,
        is_locked: user.isLocked,
        credit_balance: user.creditBalance,
        created_at: user.createdAt,
      })),
      total,
      page: query.page,
      limit: query.limit,
      total_pages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async lockUser(actorId: string, targetId: string, dto: LockUserDto, ip?: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundException('User not found');
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: targetId }, data: { isLocked: dto.locked } }),
      this.prisma.session.updateMany({
        where: { userId: targetId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId,
          action: dto.locked ? 'USER_LOCKED' : 'USER_UNLOCKED',
          targetType: 'User',
          targetId,
          ipAddress: ip,
        },
      }),
    ]);
    return { id: targetId, is_locked: dto.locked };
  }

  async grantCredits(actorId: string, targetId: string, dto: GrantCreditsDto, ip?: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundException('User not found');
    const transaction = await this.credits.credit(
      targetId,
      dto.credits,
      `admin:${actorId}:${randomUUID()}`,
      dto.reason,
      TransactionType.ADJUSTMENT,
    );
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'CREDITS_GRANTED',
        targetType: 'User',
        targetId,
        ipAddress: ip,
        metadata: { credits: dto.credits, reason: dto.reason, transactionId: transaction.id },
      },
    });
    return {
      transaction_id: transaction.id,
      credit_amount: transaction.creditAmount,
      balance_after: transaction.balanceAfter,
    };
  }

  videoList(actorId: string, query: any) {
    return this.videos.list(actorId, query, true);
  }

  async deleteVideo(actorId: string, videoId: string, ip?: string): Promise<void> {
    await this.videos.remove(actorId, videoId, true);
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'VIDEO_DELETED',
        targetType: 'Video',
        targetId: videoId,
        ipAddress: ip,
      },
    });
  }

  async jobs(query: PaginationDto) {
    const where: Prisma.VideoJobWhereInput = {
      status: VideoStatus.FAILED,
      ...(query.search ? { errorDetail: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.videoJob.findMany({
        where,
        include: { video: { include: { user: { select: { id: true, email: true } } } } },
        orderBy: { createdAt: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.videoJob.count({ where }),
    ]);
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      total_pages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async transactions(query: PaginationDto) {
    const where: Prisma.CreditTransactionWhereInput = query.search
      ? {
          OR: [
            { description: { contains: query.search, mode: 'insensitive' } },
            { user: { email: { contains: query.search, mode: 'insensitive' } } },
          ],
        }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.creditTransaction.findMany({
        where,
        include: { user: { select: { id: true, email: true, fullName: true } } },
        orderBy: { createdAt: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.creditTransaction.count({ where }),
    ]);
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      total_pages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async auditLogs(query: PaginationDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        include: { actor: { select: { id: true, email: true } } },
        orderBy: { createdAt: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.auditLog.count(),
    ]);
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      total_pages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }
}
