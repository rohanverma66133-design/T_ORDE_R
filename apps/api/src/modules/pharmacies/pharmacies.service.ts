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
export class PharmaciesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userLat?: number, userLng?: number) {
    const pharmacies = await this.prisma.pharmacy.findMany({
      where: { isActive: true },
      include: {
        address: true,
        _count: { select: { products: true } },
      },
    });

    const mapped = pharmacies.map((p) => {
      let distanceKm: number | undefined = undefined;
      let deliveryTime = '10-20 min';

      const pharmaLat = p.address?.latitude ? Number(p.address.latitude) : 21.1680;
      const pharmaLng = p.address?.longitude ? Number(p.address.longitude) : 72.8280;

      if (typeof userLat === 'number' && typeof userLng === 'number' && !isNaN(userLat) && !isNaN(userLng)) {
        distanceKm = calculateDistanceKm(userLat, userLng, pharmaLat, pharmaLng);
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
        id: p.id,
        name: p.name,
        slug: p.slug,
        licenseNumber: p.licenseNumber,
        phone: p.phone,
        address: p.address ? `${p.address.line1}, ${p.address.city}` : 'Health Hub, Block A',
        coords: { lat: pharmaLat, lng: pharmaLng },
        rating: 4.8,
        deliveryTime,
        distanceKm,
        isOpen: true,
        productCount: p._count.products,
      };
    });

    if (typeof userLat === 'number' && typeof userLng === 'number') {
      mapped.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }

    return mapped;
  }
}
