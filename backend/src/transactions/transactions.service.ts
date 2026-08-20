import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: PaginationDto) {
    const where: Prisma.CreditTransactionWhereInput = {
      userId,
      ...(query.search ? { description: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.creditTransaction.findMany({
        where,
        orderBy: { createdAt: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.creditTransaction.count({ where }),
    ]);
    return {
      items: items.map((item) => ({
        id: item.id,
        code: `TX-${item.id.slice(0, 8).toUpperCase()}`,
        type: item.type === 'DEBIT' ? 'VIDEO_USAGE' : item.type,
        status: item.status,
        description: item.description,
        credit_amount: item.creditAmount,
        amount: item.amount,
        currency: item.currency,
        video_id: item.videoId,
        created_at: item.createdAt,
      })),
      total,
      page: query.page,
      limit: query.limit,
      total_pages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }
}
