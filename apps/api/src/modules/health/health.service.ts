import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import type Redis from 'ioredis';
import type { Queue } from 'bullmq';
import type { AppEnv } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS_CLIENT } from '../../redis/redis.module';
import { SYSTEM_QUEUE } from '../../jobs/system.processor';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectQueue(SYSTEM_QUEUE) private readonly systemQueue: Queue,
    private readonly config: ConfigService<AppEnv, true>,
  ) {}

  async getHealth() {
    const checks: Record<string, 'up' | 'down'> = {
      api: 'up',
      database: 'down',
      redis: 'down',
      jobs: 'down',
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'up';
    } catch {
      checks.database = 'down';
    }

    try {
      const pingPromise = this.redis.ping();
      const timeoutPromise = new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 400));
      const res = await Promise.race([pingPromise, timeoutPromise]);
      checks.redis = res === 'PONG' ? 'up' : 'down';
    } catch {
      checks.redis = 'down';
    }

    try {
      const clientPromise = this.systemQueue.client;
      const timeoutPromise = new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 400));
      const res = await Promise.race([clientPromise, timeoutPromise]);
      checks.jobs = res !== 'timeout' && (res as any)?.status === 'ready' ? 'up' : 'down';
    } catch {
      checks.jobs = 'down';
    }

    const isDatabaseDown = checks.database === 'down';

    return {
      status: isDatabaseDown ? 'down' : checks.redis === 'down' ? 'degraded' : 'ok',
      service: 'tord-api',
      version: '0.1.0',
      environment: this.config.get('NODE_ENV', { infer: true }),
      checks,
    };
  }
}
