import { Module } from '@nestjs/common';
import { CreditsModule } from '../credits/credits.module';
import { VideosModule } from '../videos/videos.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [CreditsModule, VideosModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
