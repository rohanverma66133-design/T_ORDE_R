import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userLat?: number, userLng?: number) {
    const stores = await this.prisma.store.findMany({
      where: { isActive: true },
      include: {
        address: true,
        _count: { select: { products: true } },
      },
    });

    const mapped = stores.map((s) => {
      let distanceKm: number | undefined = undefined;
      let deliveryTime = s.estimatedDeliveryTime || '15-25 min';

      const storeLat = s.address?.latitude ? Number(s.address.latitude) : 21.1650;
      const storeLng = s.address?.longitude ? Number(s.address.longitude) : 72.8250;

      if (typeof userLat === 'number' && typeof userLng === 'number' && !isNaN(userLat) && !isNaN(userLng)) {
        distanceKm = calculateDistanceKm(userLat, userLng, storeLat, storeLng);
        if (distanceKm < 1.0) {
          deliveryTime = '10-15 min';
        } else if (distanceKm < 3.0) {
          deliveryTime = '15-20 min';
        } else if (distanceKm < 6.0) {
          deliveryTime = '20-30 min';
        } else {
          deliveryTime = '30-45 min';
        }
      }

      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        isGrocery: s.isGrocery,
        phone: s.phone,
        address: s.address ? `${s.address.line1}, ${s.address.city}` : 'Town Center, Sector 2',
        coords: { lat: storeLat, lng: storeLng },
        rating: 4.9,
        deliveryTime,
        distanceKm,
        isOpen: s.isOpen,
        productCount: s._count.products,
      };
    });

    if (typeof userLat === 'number' && typeof userLng === 'number') {
      mapped.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }

    return mapped;
  }
}
