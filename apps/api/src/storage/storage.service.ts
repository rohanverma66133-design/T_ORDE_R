import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppEnv } from '../config/env';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHmac, timingSafeEqual } from 'node:crypto';
export interface PutObjectInput { key: string; body: Buffer; contentType: string; }
export abstract class StorageDriver { abstract put(input: PutObjectInput): Promise<{ key: string }>; abstract get(key: string): Promise<Buffer>; }
@Injectable()
export class LocalStorageDriver extends StorageDriver {
  constructor(private readonly config: ConfigService<AppEnv, true>) { super(); }
  async put(input: PutObjectInput) { const root = path.resolve(this.config.get('STORAGE_LOCAL_PATH', { infer: true })); const full = path.resolve(root, input.key); if (!full.startsWith(`${root}${path.sep}`)) throw new ForbiddenException('Invalid storage key'); await mkdir(path.dirname(full), { recursive: true }); await writeFile(full, input.body, { flag: 'wx' }); return { key: input.key }; }
  async get(key: string) { const root = path.resolve(this.config.get('STORAGE_LOCAL_PATH', { infer: true })); const full = path.resolve(root, key); if (!full.startsWith(`${root}${path.sep}`)) throw new ForbiddenException('Invalid storage key'); return readFile(full); }
}
@Injectable()
export class S3StorageDriver extends StorageDriver {
  private readonly logger = new Logger(S3StorageDriver.name);
  constructor(private readonly config: ConfigService<AppEnv, true>) { super(); }
  async put(input: PutObjectInput) { this.logger.debug(`S3 private put bucket=${this.config.get('S3_BUCKET', { infer: true })} key=${input.key} type=${input.contentType}`); return { key: input.key }; }
  async get(_key: string): Promise<Buffer> { throw new Error('Configure a private S3 adapter before serving prescription files'); }
}
@Injectable()
export class StorageService {
  constructor(private readonly driver: StorageDriver, private readonly config: ConfigService<AppEnv, true>) {}
  put(input: PutObjectInput) { return this.driver.put(input); }
  get(key: string) { return this.driver.get(key); }
  sign(key: string, expiresAt: number) { return createHmac('sha256', this.config.get('JWT_ACCESS_SECRET', { infer: true })).update(`${key}:${expiresAt}`).digest('hex'); }
  assertSignature(key: string, expiresAt: number, signature: string) { if (!Number.isSafeInteger(expiresAt) || expiresAt < Date.now()) throw new ForbiddenException('Signed URL expired'); const expected = Buffer.from(this.sign(key, expiresAt)); const supplied = Buffer.from(signature); if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) throw new ForbiddenException('Invalid signed URL'); }
}