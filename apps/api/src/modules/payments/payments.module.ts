import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Public } from '../../common/decorators/auth.decorators';
import type { AppEnv } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';

class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService<AppEnv, true>) {}
  async verify(providerTransactionId: string) {
    const payment = await this.prisma.payment.findUniqueOrThrow({ where: { providerTransactionId } });
    return this.prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.CAPTURED } });
  }
  async createCodPayment(orderId: string, amount: number) {
    return this.prisma.payment.create({ data: { orderId, amount, method: PaymentMethod.CASH_ON_DELIVERY, provider: 'COD', status: PaymentStatus.PENDING } });
  }
  async webhook(signature: string | undefined, rawPayload: Buffer) {
    const secret = this.config.get('PAYMENT_WEBHOOK_SECRET', { infer: true });
    if (!secret || !signature || !Buffer.isBuffer(rawPayload)) throw new UnauthorizedException('Invalid payment webhook');
    const expected = createHmac('sha256', secret).update(rawPayload).digest('hex');
    const provided = Buffer.from(signature.replace(/^sha256=/, ''), 'hex');
    const digest = Buffer.from(expected, 'hex');
    if (provided.length !== digest.length || !timingSafeEqual(provided, digest)) throw new UnauthorizedException('Invalid payment webhook signature');
    let payload: { eventId?: string; providerTransactionId?: string; status?: string };
    try { payload = JSON.parse(rawPayload.toString('utf8')); } catch { throw new UnauthorizedException('Invalid payment webhook body'); }
    if (!payload.eventId || !payload.providerTransactionId) throw new UnauthorizedException('Invalid payment webhook event');
    const eventType = `webhook:${payload.eventId}`;
    const existing = await this.prisma.paymentTransaction.findFirst({ where: { type: eventType } });
    if (existing) return { processed: false, replay: true };
    const payment = await this.prisma.payment.findUniqueOrThrow({ where: { providerTransactionId: payload.providerTransactionId } });
    try {
      await this.prisma.$transaction([
        this.prisma.payment.update({ where: { id: payment.id }, data: { status: payload.status === 'CAPTURED' ? PaymentStatus.CAPTURED : PaymentStatus.FAILED } }),
        this.prisma.paymentTransaction.create({ data: { paymentId: payment.id, type: eventType, amount: payment.amount, status: payload.status ?? 'UNKNOWN', gatewayResponse: payload } }),
      ]);
    } catch (error: any) {
      if (error?.code === 'P2002') return { processed: false, replay: true };
      throw error;
    }
    return { processed: true };
  }
}

@Controller('payments')
class PaymentsController {
  constructor(private readonly service: PaymentsService) {}
  @Post('verify') verify(@Body() body: { providerTransactionId: string }) { return this.service.verify(body.providerTransactionId); }
  @Public()
  @Post('webhook') webhook(@Headers('x-payment-signature') signature: string, @Body() payload: Buffer) { return this.service.webhook(signature, payload); }
}

@Module({ controllers: [PaymentsController], providers: [PaymentsService], exports: [PaymentsService] })
export class PaymentsModule {}
