import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                images: true,
                store: true,
                pharmacy: true,
                inventories: true,
              },
            },
            variant: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                  images: true,
                  store: true,
                  pharmacy: true,
                  inventories: true,
                },
              },
              variant: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    }

    const items = cart.items.map((item) => {
      const totalStock = item.product.inventories.reduce((acc, inv) => acc + inv.quantity, 0);
      const unitPrice = item.variant ? Number(item.variant.price) : Number(item.product.price);
      const itemSubtotal = unitPrice * item.quantity;

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product.name,
        productSlug: item.product.slug,
        brand: item.product.brand,
        unit: item.product.unit,
        imageUrl: item.product.images.find((img) => img.isPrimary)?.url || item.product.images[0]?.url || null,
        isMedicine: item.product.isMedicine,
        isPrescriptionRequired: item.product.isPrescriptionRequired,
        unitPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        stockAvailable: totalStock,
        storeName: item.product.store?.name,
        pharmacyName: item.product.pharmacy?.name,
      };
    });

    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    const hasPrescriptionItems = items.some((item) => item.isPrescriptionRequired);

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      itemCount: items.reduce((acc, item) => acc + item.quantity, 0),
      subtotal,
      hasPrescriptionItems,
    };
  }

  async addItem(userId: string, productId: string, quantity: number, variantId?: string) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { inventories: true, variants: true },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found or inactive');
    }

    const totalStock = product.inventories.reduce((acc, inv) => acc + inv.quantity, 0);
    if (totalStock < quantity) {
      throw new BadRequestException(`Only ${totalStock} items available in stock`);
    }

    let cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }

    const existingItem = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId, variantId: variantId || null },
    });

    const unitPrice = variantId
      ? product.variants.find((v) => v.id === variantId)?.price || product.price
      : product.price;

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (totalStock < newQty) {
        throw new BadRequestException(`Cannot add more. Stock limit of ${totalStock} reached.`);
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty, unitPrice },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId || null,
          quantity,
          unitPrice,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true, product: { include: { inventories: true } } },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      const totalStock = item.product.inventories.reduce((acc, inv) => acc + inv.quantity, 0);
      if (totalStock < quantity) {
        throw new BadRequestException(`Only ${totalStock} items available in stock`);
      }
      await this.prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
    }

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return this.getCart(userId);
  }
}
