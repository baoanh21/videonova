import { Controller, Get, NotImplementedException, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('billing')
export class BillingController {
  @Get('packages')
  packages() {
    return {
      items: [
        { id: 'starter', name: 'Starter', credits: 100, price: 99000, currency: 'VND' },
        {
          id: 'creator',
          name: 'Creator',
          credits: 500,
          price: 399000,
          currency: 'VND',
          featured: true,
        },
      ],
      payment_enabled: false,
    };
  }

  @Post('checkout')
  checkout(): never {
    throw new NotImplementedException('No payment provider is configured');
  }
}
