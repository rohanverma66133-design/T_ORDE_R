import { Body, Controller, Get, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/auth.decorators';
import { CouponsService } from './coupons.service';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Public()
  @Get()
  findAll() {
    return this.couponsService.findAll();
  }

  @Public()
  @Post('validate')
  validateCoupon(@Body() body: { code: string; subtotal: number }) {
    return this.couponsService.validateCoupon(body.code, body.subtotal || 0);
  }
}
