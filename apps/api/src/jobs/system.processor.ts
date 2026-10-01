import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

export const SYSTEM_QUEUE = 'system';

@Processor(SYSTEM_QUEUE)
export class SystemJobsProcessor extends WorkerHost {
  private readonly logger = new Logger(SystemJobsProcessor.name);

  async process(job: Job<{ message?: string }>): Promise<{ ok: true }> {
    this.logger.log(`Processed system job ${job.name}: ${job.data.message ?? 'no-op'}`);
    return { ok: true };
  }
}
