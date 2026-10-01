import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  API_HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().default('api/v1'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  PAYMENT_WEBHOOK_SECRET: z.string().min(32).optional(),
  PRESCRIPTION_MAX_BYTES: z.coerce.number().int().min(1).max(20 * 1024 * 1024).default(5 * 1024 * 1024),
  OTP_CODE_LENGTH: z.coerce.number().int().min(4).max(8).default(6),
  OTP_EXPIRES_IN_SECONDS: z.coerce.number().int().min(60).default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(5),
  ALLOW_FIXED_TEST_OTP: z
    .string()
    .optional()
    .default('false')
    .transform((value) => value === 'true'),
  OTP_PROVIDER_TYPE: z.enum(['console', 'twilio', 'email', 'resend']).default('resend'),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./storage'),
  S3_ENDPOINT: z.string().optional().default(''),
  S3_BUCKET: z.string().default('tord-assets'),
  S3_ACCESS_KEY: z.string().optional().default(''),
  S3_SECRET_KEY: z.string().optional().default(''),
  S3_REGION: z.string().default('us-east-1'),
  S3_FORCE_PATH_STYLE: z
    .string()
    .optional()
    .default('true')
    .transform((value) => value === 'true'),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CALLBACK_URL: z.string().optional().default('http://localhost:3001/api/v1/auth/google/callback'),
  FRONTEND_URL: z.string().optional().default('http://localhost:3002'),
  LOG_LEVEL: z.string().default('info'),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data;
}
