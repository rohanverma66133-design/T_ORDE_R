import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { Roles } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Roles(RoleCode.ADMIN, RoleCode.SUPER_ADMIN)
  @Get('status')
  status() {
    return { module: 'admin', status: 'active' };
  }

  @Roles(RoleCode.ADMIN, RoleCode.SUPER_ADMIN)
  @Get('dashboard')
  async dashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [ordersToday, sales, activeDeliveries, pendingPrescriptions, lowStock, customers, vendors, pharmacies, recentOrders] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),
      this.prisma.order.aggregate({ where: { createdAt: { gte: today }, paymentStatus: 'CAPTURED' }, _sum: { totalAmount: true } }),
      this.prisma.deliveryAssignment.count({ where: { status: { in: ['ASSIGNED', 'ACCEPTED', 'ARRIVED_AT_STORE', 'PICKED_UP', 'IN_TRANSIT'] } } }),
      this.prisma.prescription.count({ where: { status: { in: ['UPLOADED', 'UNDER_REVIEW'] } } }),
      this.prisma.inventoryItem.count({ where: { quantity: { lte: 5 } } }),
      this.prisma.user.count({ where: { roles: { some: { role: { code: RoleCode.CUSTOMER } } } } }),
      this.prisma.vendor.count(),
      this.prisma.pharmacy.count(),
      this.prisma.order.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { customer: { select: { name: true, phone: true } }, store: true, pharmacy: true } }),
    ]);
    return { metrics: { ordersToday, salesToday: Number(sales._sum.totalAmount ?? 0), activeDeliveries, pendingPrescriptions, lowStockProducts: lowStock, customers, vendors, pharmacies }, recentOrders };
  }

  @Roles(RoleCode.ADMIN, RoleCode.SUPER_ADMIN, RoleCode.SUPPORT_AGENT)
  @Get('audit-logs')
  auditLogs(@Query('page') page = '1') {
    return this.prisma.auditLog.findMany({ take: 50, skip: (Number(page) - 1) * 50, orderBy: { createdAt: 'desc' }, include: { actor: { select: { name: true, email: true } } } });
  }

  @Roles(RoleCode.ADMIN, RoleCode.SUPER_ADMIN)
  @Post('action')
  async recordAdminAction(
    @CurrentUser('id') adminId: string,
    @Body() body: { actionType: string; description: string; targetEntity?: string; targetId?: string },
  ) {
    this.audit.record({
      actorId: adminId,
      action: 'SECURITY_ADMIN_ACTION',
      entityType: body.targetEntity || 'System',
      entityId: body.targetId,
      metadata: { actionType: body.actionType, description: body.description },
    });
    return { success: true };
  }

  @Roles(RoleCode.SUPER_ADMIN)
  @Post('users/:userId/role')
  async changeUserRole(
    @CurrentUser('id') adminId: string,
    @Param('userId') userId: string,
    @Body() body: { roleCode: RoleCode },
  ) {
    const role = await this.prisma.role.findUniqueOrThrow({
      where: { code: body.roleCode },
    });

    await this.prisma.userRole.deleteMany({ where: { userId } });
    await this.prisma.userRole.create({
      data: { userId, roleId: role.id },
    });

    this.audit.record({
      actorId: adminId,
      action: 'SECURITY_ROLE_CHANGED',
      entityType: 'User',
      entityId: userId,
      metadata: { newRole: body.roleCode },
    });

    return { updated: true, role: body.roleCode };
  }

  @Roles(RoleCode.SUPER_ADMIN)
  @Post('roles/:roleId/permissions')
  async updateRolePermissions(
    @CurrentUser('id') adminId: string,
    @Param('roleId') roleId: string,
    @Body() body: { permissionCodes: string[] },
  ) {
    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: body.permissionCodes } },
    });

    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    await this.prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId, permissionId: p.id })),
    });

    this.audit.record({
      actorId: adminId,
      action: 'SECURITY_PERMISSION_CHANGED',
      entityType: 'Role',
      entityId: roleId,
      metadata: { permissionCodes: body.permissionCodes },
    });

    return { updated: true, permissionsCount: permissions.length };
  }

  @Roles(RoleCode.ADMIN, RoleCode.SUPER_ADMIN)
  @Post('payments/:paymentId/refund')
  async processRefund(
    @CurrentUser('id') adminId: string,
    @Param('paymentId') paymentId: string,
    @Body() body: { amount: number; reason?: string },
  ) {
    const refund = await this.prisma.refund.create({
      data: {
        paymentId,
        amount: body.amount,
        reason: body.reason || 'Admin initiated refund',
        providerRefundId: `ref-${Date.now()}`,
        status: 'COMPLETED',
      },
    });

    this.audit.record({
      actorId: adminId,
      action: 'SECURITY_REFUND_PROCESSED',
      entityType: 'Payment',
      entityId: paymentId,
      metadata: { refundId: refund.id, amount: body.amount, reason: body.reason },
    });

    return refund;
  }
}
