import * as argon2 from 'argon2';
import { randomInt, randomBytes } from 'node:crypto';

export async function hashSecret(value: string): Promise<string> {
  return argon2.hash(value, { type: argon2.argon2id });
}

export async function verifySecret(hash: string, value: string): Promise<boolean> {
  return argon2.verify(hash, value);
}

export function generateNumericCode(length: number): string {
  const max = 10 ** length;
  return randomInt(0, max).toString().padStart(length, '0');
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

export function parseDurationToSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) {
    return 900;
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return amount * (multipliers[unit ?? 's'] ?? 60);
}
