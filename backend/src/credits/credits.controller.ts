import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { CreditsService } from './credits.service';

@ApiTags('credits')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('credits')
export class CreditsController {
  constructor(private readonly credits: CreditsService) {}

  @Get('balance')
  balance(@CurrentUser() user: AuthUser) {
    return this.credits.balance(user.id);
  }
}
