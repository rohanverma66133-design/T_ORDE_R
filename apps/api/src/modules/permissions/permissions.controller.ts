import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../common/decorators/auth.decorators';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get()
  list() {
    return this.prisma.permission.findMany({ orderBy: { code: 'asc' } });
  }
}
