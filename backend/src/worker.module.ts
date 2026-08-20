import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { StorageModule } from './storage/storage.module';
import { LocalFfmpegProvider } from './videos/provider/local-ffmpeg.provider';
import { VideoProcessor } from './videos/video.processor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        redact: ['req.headers.authorization', 'req.body.password', 'req.body.refresh_token'],
      },
    }),
    PrismaModule,
    StorageModule,
    QueueModule,
  ],
  providers: [LocalFfmpegProvider, VideoProcessor],
})
export class WorkerModule {}
