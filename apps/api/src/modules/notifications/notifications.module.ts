import { Body, Controller, Get, Module, Patch } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async publish(input: { userId: string; type: string; title: string; body: string; data?: object }) {
    return this.prisma.notification.create({ data: input });
  }

  list(userId: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  markRead(userId: string, input: { ids?: string[]; all?: boolean }) {
    return this.prisma.notification.updateMany({
      where: { userId, ...(input.all ? {} : { id: { in: input.ids ?? [] } }) },
      data: { isRead: true },
    });
  }

  preferences(userId: string) {
    return this.prisma.notificationPreference.upsert({ where: { userId }, create: { userId }, update: {} });
  }

  updatePreferences(userId: string, data: { emailEnabled?: boolean; smsEnabled?: boolean; pushEnabled?: boolean }) {
    return this.prisma.notificationPreference.upsert({ where: { userId }, create: { userId, ...data }, update: data });
  }
}

@Controller('notifications')
class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.service.list(userId);
  }

  @Patch('read')
  markRead(@CurrentUser('id') userId: string, @Body() body: { ids?: string[]; all?: boolean }) {
    return this.service.markRead(userId, body);
  }

  @Get('preferences')
  preferences(@CurrentUser('id') userId: string) {
    return this.service.preferences(userId);
  }

  @Patch('preferences')
  updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() body: { emailEnabled?: boolean; smsEnabled?: boolean; pushEnabled?: boolean },
  ) {
    return this.service.updatePreferences(userId, body);
  }
}

@Module({ controllers: [NotificationsController], providers: [NotificationsService], exports: [NotificationsService] })
export class NotificationsModule {}
