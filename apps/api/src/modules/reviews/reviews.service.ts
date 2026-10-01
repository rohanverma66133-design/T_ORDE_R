import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateReviewDto {
  productId?: string;
  storeId?: string;
  pharmacyId?: string;
  orderId?: string;
  rating: number;
  comment?: string;
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(productId?: string) {
    const reviews = await this.prisma.review.findMany({
      where: productId ? { productId } : undefined,
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return reviews.map((r) => ({
      id: r.id,
      userName: r.user?.name || 'Verified Buyer',
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));
  }

  async create(userId: string, dto: CreateReviewDto) {
    return this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId || null,
        storeId: dto.storeId || null,
        pharmacyId: dto.pharmacyId || null,
        orderId: dto.orderId || null,
        rating: Math.min(5, Math.max(1, dto.rating)),
        comment: dto.comment || null,
      },
    });
  }
}
