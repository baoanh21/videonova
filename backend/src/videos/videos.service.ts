import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { AssetKind, Prisma, TransactionStatus, TransactionType, VideoStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { basename } from 'path';
import { validateImageBuffer } from '../common/files/image-validation';
import { PrismaService } from '../prisma/prisma.service';
import { VIDEO_QUEUE } from '../queue/queue.constants';
import { StorageService } from '../storage/storage.service';
import { CreateVideoDto, VideoQueryDto } from './dto/videos.dto';

@Injectable()
export class VideosService {
  private readonly creditCost: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
    @InjectQueue(VIDEO_QUEUE) private readonly queue: Queue,
  ) {
    this.creditCost = config.get<number>('VIDEO_CREDIT_COST', 1);
  }

  async create(userId: string, dto: CreateVideoDto, files: Express.Multer.File[]) {
    const maxFiles = this.config.get<number>('MAX_IMAGES_PER_VIDEO', 10);
    if (!files.length) throw new BadRequestException('At least one image is required');
    if (files.length > maxFiles)
      throw new BadRequestException(`A maximum of ${maxFiles} images is allowed`);
    if (files.some((file) => !['image', 'images'].includes(file.fieldname))) {
      throw new BadRequestException('Image field must be named image or images');
    }

    const videoId = randomUUID();
    const stored: Array<{
      key: string;
      mime: string;
      size: number;
      name: string;
      position: number;
    }> = [];
    try {
      for (const [position, file] of files.entries()) {
        const detected = validateImageBuffer(file.buffer);
        const key = `videos/${userId}/${videoId}/input-${position}-${randomUUID()}.${detected.ext}`;
        await this.storage.put(key, file.buffer);
        stored.push({
          key,
          mime: detected.mime,
          size: file.size,
          name: basename(file.originalname),
          position,
        });
      }
      const video = await this.prisma.$transaction(
        async (tx) => {
          const changed = await tx.user.updateMany({
            where: { id: userId, isLocked: false, creditBalance: { gte: this.creditCost } },
            data: { creditBalance: { decrement: this.creditCost } },
          });
          if (changed.count !== 1)
            throw new BadRequestException('Not enough credits or account is locked');
          const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
          const created = await tx.video.create({
            data: {
              id: videoId,
              userId,
              title: dto.prompt.slice(0, 80),
              prompt: dto.prompt,
              model: dto.model,
              provider: 'local-ffmpeg',
              style: dto.style,
              duration: dto.duration,
              fps: dto.fps,
              aspectRatio: dto.aspect_ratio,
              enhanceQuality: dto.enhance_quality,
              creditCost: this.creditCost,
              assets: {
                create: stored.map((file) => ({
                  kind: AssetKind.INPUT_IMAGE,
                  storageKey: file.key,
                  originalName: file.name,
                  mimeType: file.mime,
                  sizeBytes: file.size,
                  position: file.position,
                })),
              },
              job: { create: { status: VideoStatus.QUEUED } },
            },
            include: { assets: true },
          });
          await tx.creditTransaction.create({
            data: {
              userId,
              videoId,
              type: TransactionType.DEBIT,
              status: TransactionStatus.COMPLETED,
              creditAmount: -this.creditCost,
              balanceAfter: user.creditBalance,
              description: 'Create video',
              idempotencyKey: `video:${videoId}:charge`,
            },
          });
          return created;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      try {
        const job = await this.queue.add(
          'render',
          { videoId },
          {
            jobId: videoId,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 100,
            removeOnFail: 500,
          },
        );
        await this.prisma.videoJob.update({ where: { videoId }, data: { queueJobId: job.id } });
      } catch (error) {
        await this.markEnqueueFailure(videoId, userId, error);
        throw new ConflictException(
          'Video was saved but could not be queued; credits were refunded',
        );
      }
      return this.serialize(video);
    } catch (error) {
      if (!(await this.prisma.video.findUnique({ where: { id: videoId } }))) {
        await Promise.all(stored.map((file) => this.storage.delete(file.key)));
      }
      throw error;
    }
  }

  async list(userId: string, query: VideoQueryDto, admin = false) {
    const where: Prisma.VideoWhereInput = {
      deletedAt: null,
      ...(admin ? {} : { userId }),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { prompt: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const orderField = query.sort === 'created_at' ? 'createdAt' : query.sort;
    const [items, total, grouped] = await this.prisma.$transaction([
      this.prisma.video.findMany({
        where,
        include: {
          assets: true,
          ...(admin ? { user: { select: { id: true, email: true, fullName: true } } } : {}),
        },
        orderBy: { [orderField]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.video.count({ where }),
      this.prisma.video.groupBy({
        by: ['status'],
        where,
        orderBy: { status: 'asc' },
        _count: true,
      }),
    ]);
    return {
      items: items.map((video) => this.serialize(video)),
      total,
      page: query.page,
      limit: query.limit,
      total_pages: Math.max(1, Math.ceil(total / query.limit)),
      summary: Object.fromEntries(grouped.map((item) => [item.status.toLowerCase(), item._count])),
    };
  }

  async detail(userId: string, id: string, admin = false) {
    const video = await this.prisma.video.findFirst({
      where: { id, deletedAt: null, ...(admin ? {} : { userId }) },
      include: { assets: true, job: true },
    });
    if (!video) throw new NotFoundException('Video not found');
    return this.serialize(video);
  }

  async status(userId: string, id: string) {
    return this.detail(userId, id);
  }

  async asset(userId: string, id: string, kind: AssetKind, admin = false) {
    const video = await this.prisma.video.findFirst({
      where: { id, deletedAt: null, ...(admin ? {} : { userId }) },
      include: { assets: { where: { kind }, orderBy: { position: 'asc' }, take: 1 } },
    });
    const asset = video?.assets[0];
    if (!video || !asset) throw new NotFoundException('Media not found');
    return {
      buffer: await this.storage.read(asset.storageKey),
      mime: asset.mimeType,
      name: asset.originalName,
    };
  }

  async cancel(userId: string, id: string) {
    const video = await this.prisma.video.findFirst({
      where: { id, userId, deletedAt: null },
      include: { job: true },
    });
    if (!video) throw new NotFoundException('Video not found');
    if (video.status !== VideoStatus.QUEUED && video.status !== VideoStatus.PROCESSING) {
      throw new ConflictException('Only queued or processing videos can be canceled');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.video.update({
        where: { id },
        data: { status: VideoStatus.CANCELED, errorMessage: null },
      });
      await tx.videoJob.update({
        where: { videoId: id },
        data: { status: VideoStatus.CANCELED, finishedAt: new Date() },
      });
      const refundKey = `video:${id}:refund`;
      const refunded = await tx.creditTransaction.findUnique({
        where: { idempotencyKey: refundKey },
      });
      if (!refunded) {
        const owner = await tx.user.update({
          where: { id: userId },
          data: { creditBalance: { increment: video.creditCost } },
        });
        await tx.creditTransaction.create({
          data: {
            userId,
            videoId: id,
            type: TransactionType.REFUND,
            status: TransactionStatus.COMPLETED,
            creditAmount: video.creditCost,
            balanceAfter: owner.creditBalance,
            description: 'Canceled video refund',
            idempotencyKey: refundKey,
          },
        });
      }
    });
    if (video.job?.queueJobId) {
      const job = await this.queue.getJob(video.job.queueJobId);
      if (job && (await job.isWaiting())) await job.remove();
    }
    return this.detail(userId, id);
  }

  async remove(userId: string, id: string, admin = false): Promise<void> {
    const video = await this.prisma.video.findFirst({
      where: { id, deletedAt: null, ...(admin ? {} : { userId }) },
      include: { assets: true },
    });
    if (!video) throw new NotFoundException('Video not found');
    if (video.status === VideoStatus.QUEUED || video.status === VideoStatus.PROCESSING) {
      throw new ConflictException('Cancel an active video before deleting it');
    }
    await this.prisma.video.update({ where: { id }, data: { deletedAt: new Date() } });
    await Promise.all(video.assets.map((asset) => this.storage.delete(asset.storageKey)));
  }

  private async markEnqueueFailure(videoId: string, userId: string, error: unknown) {
    const message = error instanceof Error ? error.message.slice(0, 2000) : 'Queue error';
    await this.prisma.$transaction(async (tx) => {
      await tx.video.update({
        where: { id: videoId },
        data: { status: VideoStatus.FAILED, errorMessage: message },
      });
      await tx.videoJob.update({
        where: { videoId },
        data: { status: VideoStatus.FAILED, errorCode: 'QUEUE_ERROR', errorDetail: message },
      });
      const exists = await tx.creditTransaction.findUnique({
        where: { idempotencyKey: `video:${videoId}:refund` },
      });
      if (!exists) {
        const user = await tx.user.update({
          where: { id: userId },
          data: { creditBalance: { increment: this.creditCost } },
        });
        await tx.creditTransaction.create({
          data: {
            userId,
            videoId,
            type: TransactionType.REFUND,
            status: TransactionStatus.COMPLETED,
            creditAmount: this.creditCost,
            balanceAfter: user.creditBalance,
            description: 'Queue failure refund',
            idempotencyKey: `video:${videoId}:refund`,
          },
        });
      }
    });
  }

  serialize(video: any) {
    const inputs = video.assets?.filter((asset: any) => asset.kind === AssetKind.INPUT_IMAGE) ?? [];
    const output = video.assets?.find((asset: any) => asset.kind === AssetKind.OUTPUT_VIDEO);
    return {
      id: video.id,
      title: video.title,
      prompt: video.prompt,
      model: video.model,
      provider: video.provider,
      style: video.style,
      duration: video.duration,
      fps: video.fps,
      aspect_ratio: video.aspectRatio,
      credit_cost: video.creditCost,
      status: video.status,
      progress: video.progress,
      thumbnail_url: inputs.length ? `/api/v1/videos/${video.id}/input` : null,
      input_image_url: inputs.length ? `/api/v1/videos/${video.id}/input` : null,
      output_video_url: output ? `/api/v1/videos/${video.id}/download` : null,
      error: video.errorMessage,
      created_at: video.createdAt,
      completed_at: video.completedAt,
      ...(video.user ? { user: video.user } : {}),
    };
  }
}
