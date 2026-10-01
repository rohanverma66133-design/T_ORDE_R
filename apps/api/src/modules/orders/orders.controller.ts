import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrdersService, type CreateOrderDto } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto, @Headers('idempotency-key') idempotencyKey?: string) {
    return this.ordersService.createOrder(userId, dto, idempotencyKey?.slice(0, 128));
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.ordersService.findAll(userId);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.ordersService.findOne(userId, id);
  }

  @Post(':id/cancel')
  cancelOrder(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.ordersService.cancelOrder(userId, id);
  }
}
