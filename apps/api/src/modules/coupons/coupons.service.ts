import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const coupons = await this.prisma.coupon.findMany({
      where: { active: true, validTo: { gte: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    return coupons.map((c) => ({
      id: c.id,
      code: c.code,
      discountType: c.discountType,
      value: Number(c.value),
      minOrderValue: Number(c.minOrderValue),
      maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
      validFrom: c.validFrom,
      validTo: c.validTo,
    }));
  }

  async validateCoupon(code: string, subtotal: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.active || new Date() > coupon.validTo) {
      throw new NotFoundException('Invalid or expired coupon code');
    }

    const minVal = Number(coupon.minOrderValue);
    if (subtotal < minVal) {
      throw new BadRequestException(`Coupon '${coupon.code}' requires a minimum order value of ₹${minVal}`);
    }

    let discountAmount = 0;
    if (coupon.discountType === 'FIXED') {
      discountAmount = Number(coupon.value);
    } else {
      discountAmount = (subtotal * Number(coupon.value)) / 100;
      if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
        discountAmount = Number(coupon.maxDiscount);
      }
    }

    discountAmount = Math.min(discountAmount, subtotal);

    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      value: Number(coupon.value),
      discountAmount: Math.round(discountAmount * 100) / 100,
    };
  }
}
