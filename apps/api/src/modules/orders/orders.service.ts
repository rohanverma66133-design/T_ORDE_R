import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateOrderDto {
  deliveryAddressId: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
  prescriptionId?: string;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(userId: string, dto: CreateOrderDto, idempotencyKey?: string) {
    if (idempotencyKey) {
      const existing = await this.prisma.order.findUnique({ where: { idempotencyKey }, include: { items: true, deliveryAddress: true, payments: true, statusHistory: true } });
      if (existing && existing.customerId === userId) return this.formatOrderResponse(existing);
    }
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try { return await this.prisma.$transaction((tx) => this.createOrderInTransaction(tx, userId, dto, idempotencyKey), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); }
      catch (error: any) { if (error?.code !== 'P2034' || attempt === 2) throw error; }
    }
    throw new BadRequestException('Unable to place order; please retry');
  }

  private async createOrderInTransaction(prisma: Prisma.TransactionClient, userId: string, dto: CreateOrderDto, idempotencyKey?: string) {
    // 1. Fetch user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { include: { inventories: true } },
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Your cart is empty');
    }

    // 2. Validate address
    const address = await prisma.address.findUnique({ where: { id: dto.deliveryAddressId } });
    if (!address || address.userId !== userId) {
      throw new NotFoundException('Delivery address not found');
    }

    // 3. Backend Recalculation of Prices & Stock Check
    let subtotal = 0;
    let taxAmount = 0;
    const orderItemsData: any[] = [];
    let storeId: string | null = null;
    let pharmacyId: string | null = null;
    let hasPrescriptionItems = false;

    for (const item of cart.items) {
      const product = item.product;
      if (!product || !product.isActive) {
        throw new BadRequestException(`Product '${product?.name || 'Item'}' is no longer available`);
      }

      if (product.isPrescriptionRequired) {
        hasPrescriptionItems = true;
      }

      if (!storeId && product.storeId) storeId = product.storeId;
      if (!pharmacyId && product.pharmacyId) pharmacyId = product.pharmacyId;

      const totalStock = product.inventories.reduce((acc, inv) => acc + inv.quantity, 0);
      if (totalStock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for '${product.name}'. Available: ${totalStock}`);
      }

      // Authoritative Price from DB (never frontend)
      const unitPrice = item.variant ? Number(item.variant.price) : Number(product.price);
      const itemSubtotal = unitPrice * item.quantity;
      const itemTax = (itemSubtotal * Number(product.taxRate)) / 100;

      subtotal += itemSubtotal;
      taxAmount += itemTax;

      orderItemsData.push({
        productId: product.id,
        variantId: item.variantId || null,
        productName: product.name,
        variantName: item.variant?.name || null,
        quantity: item.quantity,
        unitPrice,
        taxAmount: Math.round(itemTax * 100) / 100,
        totalPrice: Math.round(itemSubtotal * 100) / 100,
      });
    }

    if (hasPrescriptionItems && !dto.prescriptionId) {
      // Check if user has an approved/uploaded prescription
      const recentRx = await prisma.prescription.findFirst({
        where: { customerId: userId },
        orderBy: { uploadedAt: 'desc' },
      });
      if (!recentRx) {
        throw new BadRequestException('Prescription required for medicine order. Please upload prescription.');
      }
    }

    // 4. Delivery fee calculation
    const deliveryFee = subtotal >= 500 ? 0.0 : 25.0;

    // 5. Coupon calculation
    let discountAmount = 0.0;
    let couponId: string | null = null;
    if (dto.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: dto.couponCode.toUpperCase() },
      });
      if (coupon && coupon.active && new Date() <= coupon.validTo && subtotal >= Number(coupon.minOrderValue)) {
        couponId = coupon.id;
        if (coupon.discountType === 'FIXED') {
          discountAmount = Number(coupon.value);
        } else {
          discountAmount = (subtotal * Number(coupon.value)) / 100;
          if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
            discountAmount = Number(coupon.maxDiscount);
          }
        }
        discountAmount = Math.min(discountAmount, subtotal);
      }
    }

    // 6. Calculate total amount
    const totalAmount = Math.max(0, subtotal + taxAmount + deliveryFee - discountAmount);

    // 7. Generate order number
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const initialStatus = OrderStatus.CONFIRMED;
    const initialPaymentStatus =
      dto.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
        ? PaymentStatus.PENDING
        : PaymentStatus.CAPTURED;

    // 8. Create Order in DB
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: userId,
        storeId,
        pharmacyId,
        deliveryAddressId: dto.deliveryAddressId,
        status: initialStatus,
        paymentStatus: initialPaymentStatus,
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        deliveryFee: Math.round(deliveryFee * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        notes: dto.notes || null,
        idempotencyKey: idempotencyKey || null,
        items: { create: orderItemsData },
        statusHistory: {
          create: [
            { newStatus: OrderStatus.PENDING, reason: 'Order placed by customer' },
            { newStatus: OrderStatus.CONFIRMED, reason: 'System auto-confirmed order' },
          ],
        },
        payments: {
          create: {
            amount: Math.round(totalAmount * 100) / 100,
            method: dto.paymentMethod,
            status: initialPaymentStatus,
            providerTransactionId: `TXN-${Date.now()}`,
          },
        },
      },
      include: {
        items: true,
        deliveryAddress: true,
        payments: true,
        statusHistory: true,
      },
    });

    // 9. Update inventory (decrease stock)
    for (const item of cart.items) {
      const inventory = await prisma.inventoryItem.findFirst({ where: { productId: item.productId, quantity: { gte: item.quantity } }, orderBy: { quantity: 'desc' } });
      const decremented = inventory ? await prisma.inventoryItem.updateMany({ where: { id: inventory.id, quantity: { gte: item.quantity } }, data: { quantity: { decrement: item.quantity } } }) : { count: 0 };
      if (decremented.count !== 1) throw new BadRequestException(`Insufficient stock for '${item.product.name}'`);
    }

    // 10. Record Coupon usage if applied
    if (couponId) {
      await prisma.couponUsage.create({
        data: {
          couponId,
          userId,
          orderId: order.id,
        },
      });
    }

    // 11. Clear Cart
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return this.formatOrderResponse(order);
  }

  async findAll(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: { include: { images: true } } } },
        deliveryAddress: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payments: true,
        store: true,
        pharmacy: true,
      },
    });

    return orders.map((o) => this.formatOrderResponse(o));
  }

  async findOne(userId: string, idOrNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        AND: [
          { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }] },
          { customerId: userId },
        ],
      },
      include: {
        items: { include: { product: { include: { images: true } } } },
        deliveryAddress: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payments: true,
        store: true,
        pharmacy: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.formatOrderResponse(order);
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId: userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(`Order cannot be cancelled in status ${order.status}`);
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        statusHistory: {
          create: {
            previousStatus: order.status,
            newStatus: OrderStatus.CANCELLED,
            reason: 'Cancelled by customer',
          },
        },
      },
      include: {
        items: true,
        deliveryAddress: true,
        payments: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    return this.formatOrderResponse(updated);
  }

  private formatOrderResponse(order: any) {
    const timelineStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.ASSIGNED,
      OrderStatus.PICKED_UP,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
    ];

    const currentStatusIndex = timelineStatuses.indexOf(order.status as OrderStatus);

    const timeline = timelineStatuses.map((st, index) => {
      const historyItem = order.statusHistory?.find((h: any) => h.newStatus === st);
      const isCompleted = index <= currentStatusIndex && currentStatusIndex !== -1;
      const isCurrent = order.status === st;

      return {
        status: st,
        label: this.getStatusLabel(st),
        isCompleted,
        isCurrent,
        timestamp: historyItem?.createdAt || null,
        notes: historyItem?.reason || null,
      };
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.payments?.[0]?.method || PaymentMethod.CASH_ON_DELIVERY,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      deliveryFee: Number(order.deliveryFee),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt,
      estimatedDeliveryTime: '20-30 mins',
      notes: order.notes,
      deliveryAddress: order.deliveryAddress,
      storeName: order.store?.name || order.pharmacy?.name || 'Town Central Store',
      items: order.items.map((i: any) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        variantName: i.variantName,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
        imageUrl: i.product?.images?.[0]?.url || null,
      })),
      timeline,
    };
  }

  private getStatusLabel(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'Order Placed';
      case OrderStatus.CONFIRMED:
        return 'Confirmed';
      case OrderStatus.PROCESSING:
        return 'Processing';
      case OrderStatus.READY_FOR_PICKUP:
        return 'Ready for Pickup';
      case OrderStatus.ASSIGNED:
        return 'Delivery Partner Assigned';
      case OrderStatus.PICKED_UP:
        return 'Picked Up';
      case OrderStatus.OUT_FOR_DELIVERY:
        return 'Out for Delivery';
      case OrderStatus.DELIVERED:
        return 'Delivered';
      case OrderStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
    }
  }
}
