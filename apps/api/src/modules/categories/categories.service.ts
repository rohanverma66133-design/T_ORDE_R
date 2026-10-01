import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { CreateCategoryInput, UpdateCategoryInput } from '@tord/validation';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      isMedicine: cat.isMedicine,
      displayOrder: cat.displayOrder,
      productCount: cat._count.products,
      icon: cat.isMedicine ? (cat.slug.includes('prescription') ? '🏥' : '💊') : cat.slug.includes('dairy') ? '🥛' : '🥦',
    }));
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category '${slug}' not found`);
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      isMedicine: category.isMedicine,
      productCount: category._count.products,
    };
  }

  async create(dto: CreateCategoryInput) {
    const slug = dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException(`Category with slug '${slug}' already exists`);
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description || null,
        parentId: dto.parentId || null,
        isMedicine: dto.isMedicine ?? false,
        displayOrder: dto.displayOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryInput) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.parentId !== undefined) data.parentId = dto.parentId;
    if (dto.isMedicine !== undefined) data.isMedicine = dto.isMedicine;
    if (dto.displayOrder !== undefined) data.displayOrder = dto.displayOrder;

    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    await this.prisma.category.delete({ where: { id } });
    return { success: true, deletedId: id };
  }
}

