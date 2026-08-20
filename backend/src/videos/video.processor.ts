import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { AssetKind, TransactionStatus, TransactionType, VideoStatus } from '@prisma/client';
import { Job, UnrecoverableError } from 'bullmq';
import { stat } from 'fs/promises';
import { PrismaService } from '../prisma/prisma.service';
import { VIDEO_QUEUE } from '../queue/queue.constants';
import { StorageService } from '../storage/storage.service';
import { LocalFfmpegProvider } from './provider/local-ffmpeg.provider';

interface VideoJobData {
  videoId: string;
}

@Injectable()
@Processor(VIDEO_QUEUE, { concurrency: 2 })
export class VideoProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly provider: LocalFfmpegProvider,
  ) {
    super();
  }

  async process(job: Job<VideoJobData>): Promise<void> {
    const video = await this.prisma.video.findUnique({
      where: { id: job.data.videoId },
      include: {
        assets: { where: { kind: AssetKind.INPUT_IMAGE }, orderBy: { position: 'asc' } },
        job: true,
      },
    });
    if (!video) throw new UnrecoverableError('Video does not exist');
    if (video.status === VideoStatus.CANCELED) return;
    if (video.status === VideoStatus.SUCCEEDED) return;
    if (!video.assets.length) throw new UnrecoverableError('Video has no input images');

    await this.prisma.$transaction([
      this.prisma.video.update({
        where: { id: video.id },
        data: {
          status: VideoStatus.PROCESSING,
          progress: Math.max(video.progress, 1),
          errorMessage: null,
        },
      }),
      this.prisma.videoJob.update({
        where: { videoId: video.id },
        data: {
          status: VideoStatus.PROCESSING,
          attempts: { increment: 1 },
          startedAt: new Date(),
          errorCode: null,
          errorDetail: null,
        },
      }),
    ]);
    const outputKey = `videos/${video.userId}/${video.id}/output.mp4`;
    let lastProgress = 0;
    try {
      await this.provider.render({
        inputs: video.assets.map((asset) => this.storage.path(asset.storageKey)),
        output: this.storage.path(outputKey),
        duration: video.duration,
        fps: video.fps,
        aspectRatio: video.aspectRatio,
        onProgress: (progress) => {
          if (progress >= lastProgress + 5) {
            lastProgress = progress;
            void job.updateProgress(progress);
            void this.prisma.video.updateMany({
              where: { id: video.id, status: VideoStatus.PROCESSING },
              data: { progress },
            });
          }
        },
        shouldCancel: async () => {
          const current = await this.prisma.video.findUnique({
            where: { id: video.id },
            select: { status: true },
          });
          return current?.status === VideoStatus.CANCELED;
        },
      });
      const outputStat = await stat(this.storage.path(outputKey));
      await this.prisma.$transaction(async (tx) => {
        const current = await tx.video.findUniqueOrThrow({ where: { id: video.id } });
        if (current.status === VideoStatus.CANCELED) return;
        await tx.mediaAsset.upsert({
          where: { storageKey: outputKey },
          create: {
            videoId: video.id,
            kind: AssetKind.OUTPUT_VIDEO,
            storageKey: outputKey,
            originalName: `${video.id}.mp4`,
            mimeType: 'video/mp4',
            sizeBytes: outputStat.size,
          },
          update: { sizeBytes: outputStat.size },
        });
        await tx.video.update({
          where: { id: video.id },
          data: {
            status: VideoStatus.SUCCEEDED,
            progress: 100,
            completedAt: new Date(),
            errorMessage: null,
          },
        });
        await tx.videoJob.update({
          where: { videoId: video.id },
          data: {
            status: VideoStatus.SUCCEEDED,
            finishedAt: new Date(),
            errorCode: null,
            errorDetail: null,
          },
        });
        await tx.notification.create({
          data: {
            userId: video.userId,
            videoId: video.id,
            type: 'VIDEO_COMPLETED',
            title: 'Video đã hoàn tất',
            message: `Video “${video.title}” đã sẵn sàng.`,
          },
        });
      });
    } catch (error) {
      await this.storage.delete(outputKey);
      const message = error instanceof Error ? error.message : 'Unknown render error';
      if (message === 'VIDEO_CANCELED') return;
      const finalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      if (finalAttempt) await this.failAndRefund(video.id, video.userId, video.creditCost, message);
      else {
        await this.prisma.$transaction([
          this.prisma.video.update({
            where: { id: video.id },
            data: { status: VideoStatus.QUEUED, errorMessage: message.slice(0, 2000) },
          }),
          this.prisma.videoJob.update({
            where: { videoId: video.id },
            data: {
              status: VideoStatus.QUEUED,
              errorCode: 'RENDER_RETRY',
              errorDetail: message.slice(0, 4000),
            },
          }),
        ]);
      }
      throw error;
    }
  }

  private async failAndRefund(
    videoId: string,
    userId: string,
    creditCost: number,
    message: string,
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.video.update({
        where: { id: videoId },
        data: { status: VideoStatus.FAILED, errorMessage: message.slice(0, 2000) },
      });
      await tx.videoJob.update({
        where: { videoId },
        data: {
          status: VideoStatus.FAILED,
          finishedAt: new Date(),
          errorCode: 'RENDER_FAILED',
          errorDetail: message.slice(0, 4000),
        },
      });
      const key = `video:${videoId}:refund`;
      const existing = await tx.creditTransaction.findUnique({ where: { idempotencyKey: key } });
      if (!existing) {
        const user = await tx.user.update({
          where: { id: userId },
          data: { creditBalance: { increment: creditCost } },
        });
        await tx.creditTransaction.create({
          data: {
            userId,
            videoId,
            type: TransactionType.REFUND,
            status: TransactionStatus.COMPLETED,
            creditAmount: creditCost,
            balanceAfter: user.creditBalance,
            description: 'Failed video job refund',
            idempotencyKey: key,
          },
        });
      }
      await tx.notification.create({
        data: {
          userId,
          videoId,
          type: 'VIDEO_FAILED',
          title: 'Tạo video thất bại',
          message: 'Tác vụ không thể hoàn tất và credit đã được hoàn lại.',
        },
      });
    });
  }
}
