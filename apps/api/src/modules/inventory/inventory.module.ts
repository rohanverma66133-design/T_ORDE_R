import { Body, Controller, Get, Post } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { Roles } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { Module, BadRequestException } from '@nestjs/common';

class InventoryService {
  constructor(private readonly prisma: PrismaService) {}
  list() { return this.prisma.inventoryItem.findMany({ include: { product: true, variant: true }, orderBy: { updatedAt: 'desc' } }); }
  async adjust(actorUserId: string, input: { inventoryItemId: string; quantityChange: number; notes?: string }) {
    if (!Number.isInteger(input.quantityChange) || input.quantityChange === 0) throw new BadRequestException('quantityChange must be a non-zero integer');
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUniqueOrThrow({ where: { id: input.inventoryItemId } });
      const quantity = item.quantity + input.quantityChange;
      if (quantity < item.reserved) throw new BadRequestException('Inventory cannot fall below reserved stock');
      const updated = await tx.inventoryItem.update({ where: { id: item.id }, data: { quantity } });
      await tx.inventoryTransaction.create({ data: { inventoryItemId: item.id, type: 'ADJUSTMENT', quantityChange: input.quantityChange, previousQuantity: item.quantity, newQuantity: quantity, actorUserId, notes: input.notes } });
      return updated;
    });
  }
}

@Controller('inventory')
class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Roles(RoleCode.ADMIN, RoleCode.SUPER_ADMIN, RoleCode.VENDOR_ADMIN, RoleCode.PHARMACY_ADMIN)
  @Get()
  list() { return this.service.list(); }

  @Roles(RoleCode.ADMIN, RoleCode.SUPER_ADMIN, RoleCode.VENDOR_ADMIN, RoleCode.PHARMACY_ADMIN)
  @Post('adjust')
  adjust(@CurrentUser('id') actorId: string, @Body() body: { inventoryItemId: string; quantityChange: number; notes?: string }) {
    return this.service.adjust(actorId, body);
  }
}

@Module({ controllers: [InventoryController], providers: [InventoryService], exports: [InventoryService] })
export class InventoryModule {}
