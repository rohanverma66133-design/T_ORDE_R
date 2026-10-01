import { Controller, Get, Param } from '@nestjs/common';
import { Roles } from '../../common/decorators/auth.decorators';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly prisma: PrismaService) {}

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get()
  list() {
    return this.prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    });
  }

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get(':code')
  getByCode(@Param('code') code: string) {
    return this.prisma.role.findFirstOrThrow({
      where: { code: code as never },
      include: { permissions: { include: { permission: true } } },
    });
  }
}
