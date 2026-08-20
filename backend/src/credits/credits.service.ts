import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CreditsService {
  constructor(private readonly prisma: PrismaService) {}

  async balance(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { creditBalance: true },
    });
    return {
      balance: user.creditBalance,
      paid_credit: user.creditBalance,
      free_remaining: 0,
      free_limit: 0,
      free_used: 0,
      next_reset_at: null,
    };
  }

  async debit(
    userId: string,
    credits: number,
    idempotencyKey: string,
    description: string,
    videoId?: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.creditTransaction.findUnique({ where: { idempotencyKey } });
        if (existing) return existing;
        const changed = await tx.user.updateMany({
          where: { id: userId, creditBalance: { gte: credits } },
          data: { creditBalance: { decrement: credits } },
        });
        if (changed.count !== 1)
          throw new HttpException('Not enough credits', HttpStatus.PAYMENT_REQUIRED);
        const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
        return tx.creditTransaction.create({
          data: {
            userId,
            videoId,
            type: TransactionType.DEBIT,
            status: TransactionStatus.COMPLETED,
            creditAmount: -credits,
            balanceAfter: user.creditBalance,
            description,
            idempotencyKey,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async credit(
    userId: string,
    credits: number,
    idempotencyKey: string,
    description: string,
    type: TransactionType = TransactionType.CREDIT,
    videoId?: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.creditTransaction.findUnique({ where: { idempotencyKey } });
        if (existing) return existing;
        const user = await tx.user.update({
          where: { id: userId },
          data: { creditBalance: { increment: credits } },
        });
        return tx.creditTransaction.create({
          data: {
            userId,
            videoId,
            type,
            status: TransactionStatus.COMPLETED,
            creditAmount: credits,
            balanceAfter: user.creditBalance,
            description,
            idempotencyKey,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async refundVideo(userId: string, videoId: string, credits: number) {
    return this.credit(
      userId,
      credits,
      `video:${videoId}:refund`,
      'Refund for failed video job',
      TransactionType.REFUND,
      videoId,
    );
  }
}
