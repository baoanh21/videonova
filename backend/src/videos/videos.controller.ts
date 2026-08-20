import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AssetKind } from '@prisma/client';
import { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { CreateVideoDto, VideoQueryDto } from './dto/videos.dto';
import { VideosService } from './videos.service';

@ApiTags('videos')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('videos')
export class VideosController {
  constructor(private readonly videos: VideosService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    AnyFilesInterceptor({
      limits: { fileSize: 10 * 1024 * 1024, files: 10, fields: 20 },
    }),
  )
  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Body() dto: CreateVideoDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.status(HttpStatus.ACCEPTED);
    return this.videos.create(user.id, dto, files);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: VideoQueryDto) {
    return this.videos.list(user.id, query);
  }

  @Get(':id/status')
  status(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.videos.status(user.id, id);
  }

  @Get(':id/input')
  async input(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() response: Response,
  ) {
    const media = await this.videos.asset(user.id, id, AssetKind.INPUT_IMAGE);
    response.type(media.mime).send(media.buffer);
  }

  @Get(':id/download')
  async download(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() response: Response,
  ) {
    const media = await this.videos.asset(user.id, id, AssetKind.OUTPUT_VIDEO);
    response.setHeader('Content-Disposition', `attachment; filename="videonova-${id}.mp4"`);
    response.type('video/mp4').send(media.buffer);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.videos.cancel(user.id, id);
  }

  @Get(':id')
  detail(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.videos.detail(user.id, id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.videos.remove(user.id, id);
  }
}
