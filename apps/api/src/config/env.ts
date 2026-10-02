import { z } from 'zod';

const emptyToUndefined = (value: unknown) =>
  value === '' || value === null ? undefined : value;

const coerceBoolean = z.preprocess(
  (value) => {
    if (value === true || value === false) return value;
    if (typeof value !== 'string') return false;
    const normalized = value.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') return true;
    return false;
  },
  z.boolean(),
);

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(65535).default(3001),
  ),
  API_HOST: z.preprocess(emptyToUndefined, z.string().default('0.0.0.0')),
  API_PREFIX: z.preprocess(emptyToUndefined, z.string().default('api/v1')),
  DATABASE_URL: z.string().trim().min(1),
  REDIS_URL: z.string().trim().min(1),
  JWT_ACCESS_SECRET: z.string().trim().min(16),
  JWT_REFRESH_SECRET: z.string().trim().min(16),
  JWT_ACCESS_EXPIRES_IN: z.preprocess(emptyToUndefined, z.string().default('15m')),
  JWT_REFRESH_EXPIRES_IN: z.preprocess(emptyToUndefined, z.string().default('7d')),
  PAYMENT_WEBHOOK_SECRET: z.string().trim().min(32).optional().or(z.literal('')),
  PRESCRIPTION_MAX_BYTES: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(20 * 1024 * 1024).default(5 * 1024 * 1024),
  ),
  OTP_CODE_LENGTH: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(4).max(8).default(6),
  ),
  OTP_EXPIRES_IN_SECONDS: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(60).default(300),
  ),
  OTP_MAX_ATTEMPTS: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).default(5),
  ),
  ALLOW_FIXED_TEST_OTP: z.preprocess(emptyToUndefined, coerceBoolean.default(false)),
  OTP_PROVIDER_TYPE: z.preprocess(
    emptyToUndefined,
    z.enum(['console', 'twilio', 'email', 'resend']).default('resend'),
  ),
  RESEND_API_KEY: z.string().trim().optional().or(z.literal('')),
  RESEND_FROM_EMAIL: z.string().trim().optional().or(z.literal('')),
  STORAGE_DRIVER: z.preprocess(
    emptyToUndefined,
    z.enum(['local', 's3']).default('local'),
  ),
  STORAGE_LOCAL_PATH: z.preprocess(emptyToUndefined, z.string().default('./storage')),
  S3_ENDPOINT: z.string().trim().optional().default(''),
  S3_BUCKET: z.preprocess(emptyToUndefined, z.string().default('tord-assets')),
  S3_ACCESS_KEY: z.string().trim().optional().default(''),
  S3_SECRET_KEY: z.string().trim().optional().default(''),
  S3_REGION: z.preprocess(emptyToUndefined, z.string().default('us-east-1')),
  S3_FORCE_PATH_STYLE: z.preprocess(emptyToUndefined, coerceBoolean.default(true)),
  WEB_ORIGIN: z.preprocess(
    (value) => (typeof value === 'string' ? value.replace(/\/+$/, '') : value),
    z.preprocess(emptyToUndefined, z.string().default('http://localhost:3000')),
  ),
  GOOGLE_CLIENT_ID: z.string().trim().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().trim().optional().default(''),
  GOOGLE_CALLBACK_URL: z.string().trim().optional().default('http://localhost:3001/api/v1/auth/google/callback'),
  FRONTEND_URL: z.string().trim().optional().default('http://localhost:3002'),
  LOG_LEVEL: z.preprocess(emptyToUndefined, z.string().default('info')),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data;
}
