import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SYSTEM_QUEUE } from '../../jobs/system.processor';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [BullModule.registerQueue({ name: SYSTEM_QUEUE })],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
