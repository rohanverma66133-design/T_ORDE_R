import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/auth.decorators';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('public')
  async publicSettings() {
    const name = await this.prisma.systemSetting.findUnique({ where: { key: 'platform.name' } });
    const valueObj = name?.value as { name?: string } | null;
    return { platformName: valueObj?.name ?? 'T-Ord Delivery' };
  }
}
