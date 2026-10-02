import { z } from 'zod';

const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (
      trimmed === '' ||
      trimmed === 'undefined' ||
      trimmed === 'null' ||
      trimmed === 'NaN' ||
      trimmed === 'nan'
    ) {
      return undefined;
    }
    return trimmed;
  }
  return value === null ? undefined : value;
};

const coerceBoolean = (value: unknown): boolean => {
  if (value === true || value === false) return value;
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') return true;
  return false;
};

const coerceNumberWithDefault = (defaultValue: number, min?: number, max?: number) =>
  z.preprocess((value) => {
    const sanitized = sanitizeValue(value);
    if (sanitized === undefined) return defaultValue;
    if (typeof sanitized === 'number' && !Number.isNaN(sanitized)) {
      if (min !== undefined && sanitized < min) return defaultValue;
      if (max !== undefined && sanitized > max) return defaultValue;
      return Math.trunc(sanitized);
    }
    if (typeof sanitized === 'string') {
      const cleaned = sanitized.replace(/^['"]|['"]$/g, '');
      const parsed = Number(cleaned);
      if (!Number.isNaN(parsed)) {
        if (min !== undefined && parsed < min) return defaultValue;
        if (max !== undefined && parsed > max) return defaultValue;
        return Math.trunc(parsed);
      }
    }
    return defaultValue;
  }, z.number().int());

export function parsePort(val: unknown): number | undefined {
  if (typeof val === 'number' && !Number.isNaN(val) && val >= 1 && val <= 65535) {
    return Math.trunc(val);
  }
  if (typeof val === 'string') {
    const cleaned = val.trim().replace(/^['"]|['"]$/g, '');
    if (
      cleaned === '' ||
      cleaned === 'undefined' ||
      cleaned === 'null' ||
      cleaned === 'NaN' ||
      cleaned === 'nan' ||
      cleaned === '$PORT' ||
      cleaned === '${PORT}'
    ) {
      return undefined;
    }
    const parsed = Number(cleaned);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 65535) {
      return Math.trunc(parsed);
    }
  }
  return undefined;
}

export function resolvePort(config: Record<string, unknown>): number {
  return parsePort(config.API_PORT) ?? parsePort(config.PORT) ?? 3001;
}

export const envSchema = z.object({
  NODE_ENV: z.preprocess(
    (val) => {
      const s = sanitizeValue(val);
      return s === 'production' || s === 'test' || s === 'development' ? s : 'development';
    },
    z.enum(['development', 'test', 'production']).default('development'),
  ),
  API_PORT: z.preprocess(
    (val) => parsePort(val) ?? 3001,
    z.number().int().min(1).max(65535).default(3001),
  ),
  API_HOST: z.preprocess((val) => sanitizeValue(val) ?? '0.0.0.0', z.string().default('0.0.0.0')),
  API_PREFIX: z.preprocess((val) => sanitizeValue(val) ?? 'api/v1', z.string().default('api/v1')),
  DATABASE_URL: z.string().trim().min(1),
  REDIS_URL: z.string().trim().min(1),
  JWT_ACCESS_SECRET: z.string().trim().min(16),
  JWT_REFRESH_SECRET: z.string().trim().min(16),
  JWT_ACCESS_EXPIRES_IN: z.preprocess((val) => sanitizeValue(val) ?? '15m', z.string().default('15m')),
  JWT_REFRESH_EXPIRES_IN: z.preprocess((val) => sanitizeValue(val) ?? '7d', z.string().default('7d')),
  PAYMENT_WEBHOOK_SECRET: z.preprocess(
    (val) => sanitizeValue(val) ?? '',
    z.string().trim().min(32).optional().or(z.literal('')),
  ),
  PRESCRIPTION_MAX_BYTES: coerceNumberWithDefault(5 * 1024 * 1024, 1, 20 * 1024 * 1024),
  OTP_CODE_LENGTH: coerceNumberWithDefault(6, 4, 8),
  OTP_EXPIRES_IN_SECONDS: coerceNumberWithDefault(300, 60),
  OTP_MAX_ATTEMPTS: coerceNumberWithDefault(5, 1),
  ALLOW_FIXED_TEST_OTP: z.preprocess((val) => coerceBoolean(sanitizeValue(val)), z.boolean().default(false)),
  OTP_PROVIDER_TYPE: z.preprocess(
    (val) => {
      const s = sanitizeValue(val);
      return s && ['console', 'twilio', 'email', 'resend'].includes(s as string) ? s : 'resend';
    },
    z.enum(['console', 'twilio', 'email', 'resend']).default('resend'),
  ),
  RESEND_API_KEY: z.preprocess((val) => sanitizeValue(val) ?? '', z.string().trim().optional().or(z.literal(''))),
  RESEND_FROM_EMAIL: z.preprocess((val) => sanitizeValue(val) ?? '', z.string().trim().optional().or(z.literal(''))),
  STORAGE_DRIVER: z.preprocess(
    (val) => {
      const s = sanitizeValue(val);
      return s && ['local', 's3'].includes(s as string) ? s : 'local';
    },
    z.enum(['local', 's3']).default('local'),
  ),
  STORAGE_LOCAL_PATH: z.preprocess((val) => sanitizeValue(val) ?? './storage', z.string().default('./storage')),
  S3_ENDPOINT: z.preprocess((val) => sanitizeValue(val) ?? '', z.string().trim().optional().default('')),
  S3_BUCKET: z.preprocess((val) => sanitizeValue(val) ?? 'tord-assets', z.string().default('tord-assets')),
  S3_ACCESS_KEY: z.preprocess((val) => sanitizeValue(val) ?? '', z.string().trim().optional().default('')),
  S3_SECRET_KEY: z.preprocess((val) => sanitizeValue(val) ?? '', z.string().trim().optional().default('')),
  S3_REGION: z.preprocess((val) => sanitizeValue(val) ?? 'us-east-1', z.string().default('us-east-1')),
  S3_FORCE_PATH_STYLE: z.preprocess((val) => coerceBoolean(sanitizeValue(val) ?? true), z.boolean().default(true)),
  WEB_ORIGIN: z.preprocess(
    (value) => {
      const s = sanitizeValue(value);
      if (typeof s === 'string') return s.replace(/\/+$/, '');
      return 'http://localhost:3000';
    },
    z.string().default('http://localhost:3000'),
  ),
  GOOGLE_CLIENT_ID: z.preprocess((val) => sanitizeValue(val) ?? '', z.string().trim().optional().default('')),
  GOOGLE_CLIENT_SECRET: z.preprocess((val) => sanitizeValue(val) ?? '', z.string().trim().optional().default('')),
  GOOGLE_CALLBACK_URL: z.preprocess(
    (val) => sanitizeValue(val) ?? 'http://localhost:3001/api/v1/auth/google/callback',
    z.string().trim().optional().default('http://localhost:3001/api/v1/auth/google/callback'),
  ),
  FRONTEND_URL: z.preprocess(
    (val) => sanitizeValue(val) ?? 'http://localhost:3002',
    z.string().trim().optional().default('http://localhost:3002'),
  ),
  LOG_LEVEL: z.preprocess((val) => sanitizeValue(val) ?? 'info', z.string().default('info')),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const normalizedConfig: Record<string, unknown> = { ...config };
  normalizedConfig.API_PORT = resolvePort(normalizedConfig);
  const parsed = envSchema.safeParse(normalizedConfig);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data;
}
