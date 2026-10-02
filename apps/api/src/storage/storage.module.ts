import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppEnv } from '../config/env';
import { LocalStorageDriver, S3StorageDriver, StorageDriver, StorageService } from './storage.service';

@Module({
  providers: [
    {
      provide: StorageDriver,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppEnv, true>) => {
        const driver = config.get('STORAGE_DRIVER', { infer: true });
        return driver === 's3' ? new S3StorageDriver(config) : new LocalStorageDriver(config);
      },
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
