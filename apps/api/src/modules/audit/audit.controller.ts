import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../common/decorators/auth.decorators';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get()
  list() {
    return this.prisma.auditLog.findMany({ take: 50, orderBy: { createdAt: 'desc' } });
  }
}
