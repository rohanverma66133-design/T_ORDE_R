import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../../common/decorators/auth.decorators';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}
  @Public() @Get() getHealth() { return this.health.getHealth(); }
  @Public() @Get('live') live() { return { status: 'ok' }; }
  @Public() @Get('ready') async ready() {
    const health = await this.health.getHealth();
    if (health.status !== 'ok') throw new ServiceUnavailableException({ status: 'unavailable' });
    return { status: 'ok' };
  }
}