import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ProductQueryDto {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  isMedicine?: boolean;
  isPrescriptionRequired?: boolean;
  inStock?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating';
  page?: number;
  limit?: number;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      brand,
      isMedicine,
      isPrescriptionRequired,
      inStock,
      sortBy = 'newest',
      page = 1,
      limit = 20,
    } = query;

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const where: any = { isActive: true };

    if (category) {
      where.category = {
        OR: [
          { slug: category },
          { parent: { slug: category } },
        ],
      };
    }

    if (isMedicine !== undefined) {
      where.isMedicine = String(isMedicine) === 'true';
    }

    if (isPrescriptionRequired !== undefined) {
      where.isPrescriptionRequired = String(isPrescriptionRequired) === 'true';
    }

    if (brand) {
      where.brand = { contains: brand, mode: 'insensitive' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = Number(minPrice);
      if (maxPrice !== undefined) where.price.lte = Number(maxPrice);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (String(inStock) === 'true') {
      where.inventories = { some: { quantity: { gt: 0 } } };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { price: 'asc' };
    if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    if (sortBy === 'newest') orderBy = { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: safeLimit,
        include: {
          category: true,
          images: true,
          store: true,
          pharmacy: true,
          inventories: true,
          reviews: { select: { rating: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const formattedItems = items.map((product) => {
      const avgRating =
        product.reviews.length > 0
          ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
          : 4.8;
      const totalStock = product.inventories.reduce((acc, inv) => acc + inv.quantity, 0);

      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        description: product.description,
        brand: product.brand,
        unit: product.unit,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        taxRate: Number(product.taxRate),
        isMedicine: product.isMedicine,
        isPrescriptionRequired: product.isPrescriptionRequired,
        category: product.category,
        imageUrl: product.images.find((i) => i.isPrimary)?.url || product.images[0]?.url || null,
        images: product.images.map((img) => img.url),
        store: product.store,
        pharmacy: product.pharmacy,
        inStock: totalStock > 0,
        stockQuantity: totalStock,
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: product.reviews.length || 12,
      };
    });

    return {
      items: formattedItems,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      include: {
        category: true,
        images: { orderBy: { displayOrder: 'asc' } },
        variants: true,
        store: true,
        pharmacy: true,
        vendor: true,
        inventories: true,
        reviews: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with identifier '${slug}' not found`);
    }

    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
        : 4.9;

    const totalStock = product.inventories.reduce((acc, inv) => acc + inv.quantity, 0);

    // Fetch related products in same category
    const relatedProducts = product.categoryId
      ? await this.prisma.product.findMany({
          where: { categoryId: product.categoryId, NOT: { id: product.id } },
          take: 4,
          include: { category: true, images: true, inventories: true },
        })
      : [];

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      description: product.description,
      brand: product.brand,
      unit: product.unit,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      taxRate: Number(product.taxRate),
      isMedicine: product.isMedicine,
      isPrescriptionRequired: product.isPrescriptionRequired,
      category: product.category,
      vendor: product.vendor,
      store: product.store,
      pharmacy: product.pharmacy,
      imageUrl: product.images.find((i) => i.isPrimary)?.url || product.images[0]?.url || null,
      images: product.images.map((img) => img.url),
      variants: product.variants.map((v) => ({ ...v, price: Number(v.price) })),
      inStock: totalStock > 0,
      stockQuantity: totalStock,
      rating: Math.round(avgRating * 10) / 10,
      reviews: product.reviews.map((r) => ({
        id: r.id,
        userName: r.user?.name || 'Verified Buyer',
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
      relatedProducts: relatedProducts.map((rel) => ({
        id: rel.id,
        name: rel.name,
        slug: rel.slug,
        unit: rel.unit,
        price: Number(rel.price),
        compareAtPrice: rel.compareAtPrice ? Number(rel.compareAtPrice) : null,
        categoryName: rel.category?.name,
        imageUrl: rel.images[0]?.url || null,
        isMedicine: rel.isMedicine,
        isPrescriptionRequired: rel.isPrescriptionRequired,
        inStock: rel.inventories.reduce((acc, inv) => acc + inv.quantity, 0) > 0,
      })),
    };
  }
}
