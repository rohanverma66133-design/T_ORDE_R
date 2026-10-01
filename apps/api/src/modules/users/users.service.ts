import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface UpdateProfileDto {
  name?: string;
  email?: string;
  phone?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        addresses: { orderBy: { isDefault: 'desc' } },
        _count: {
          select: { orders: true, prescriptions: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      name: user.name || 'Valued Customer',
      email: user.email,
      phone: user.phone,
      status: user.status,
      roles: user.roles.map((r) => r.role.code),
      defaultAddress: user.addresses.find((a) => a.isDefault) || user.addresses[0] || null,
      stats: {
        totalOrders: user._count.orders,
        prescriptionsCount: user._count.prescriptions,
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
      },
      include: { roles: { include: { role: true } } },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      roles: user.roles.map((r) => r.role.code),
    };
  }
}
