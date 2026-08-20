import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user';
import { VideoQueryDto } from '../videos/dto/videos.dto';
import { AdminService } from './admin.service';
import { GrantCreditsDto, LockUserDto } from './dto/admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}
  @Get('dashboard') dashboard() {
    return this.admin.dashboard();
  }
  @Get('users') users(@Query() query: PaginationDto) {
    return this.admin.users(query);
  }
  @Patch('users/:id/lock') lock(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LockUserDto,
    @Req() req: Request,
  ) {
    return this.admin.lockUser(actor.id, id, dto, req.ip);
  }
  @Post('users/:id/credits') credits(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GrantCreditsDto,
    @Req() req: Request,
  ) {
    return this.admin.grantCredits(actor.id, id, dto, req.ip);
  }
  @Get('videos') videos(@CurrentUser() actor: AuthUser, @Query() query: VideoQueryDto) {
    return this.admin.videoList(actor.id, query);
  }
  @HttpCode(HttpStatus.NO_CONTENT) @Delete('videos/:id') deleteVideo(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    return this.admin.deleteVideo(actor.id, id, req.ip);
  }
  @Get('jobs/failed') jobs(@Query() query: PaginationDto) {
    return this.admin.jobs(query);
  }
  @Get('transactions') transactions(@Query() query: PaginationDto) {
    return this.admin.transactions(query);
  }
  @Get('audit-logs') audit(@Query() query: PaginationDto) {
    return this.admin.auditLogs(query);
  }
}
