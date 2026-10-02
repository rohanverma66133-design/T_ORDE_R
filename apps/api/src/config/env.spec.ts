import { validateEnv, resolvePort, parsePort } from './env';

describe('Environment Configuration Validation', () => {
  const baseValidEnv = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: '12345678901234567890123456789012',
    JWT_REFRESH_SECRET: '12345678901234567890123456789012',
  };

  it('should parse valid environment with defaults', () => {
    const env = validateEnv(baseValidEnv);
    expect(env.API_PORT).toBe(3001);
    expect(env.NODE_ENV).toBe('development');
    expect(env.API_HOST).toBe('0.0.0.0');
    expect(env.API_PREFIX).toBe('api/v1');
    expect(env.OTP_CODE_LENGTH).toBe(6);
    expect(env.PRESCRIPTION_MAX_BYTES).toBe(5 * 1024 * 1024);
  });

  it('should handle Render PORT variable when API_PORT is not set', () => {
    const env = validateEnv({
      ...baseValidEnv,
      PORT: '10000',
    });
    expect(env.API_PORT).toBe(10000);
  });

  it('should handle Render PORT variable when API_PORT is empty, nan, undefined, or placeholder', () => {
    const cases = ['', 'undefined', 'null', 'nan', 'NaN', '$PORT', '${PORT}', '  '];
    for (const apiPort of cases) {
      const env = validateEnv({
        ...baseValidEnv,
        API_PORT: apiPort,
        PORT: '10000',
      });
      expect(env.API_PORT).toBe(10000);
    }
  });

  it('should fallback to 3001 if neither API_PORT nor PORT is valid', () => {
    const env = validateEnv({
      ...baseValidEnv,
      API_PORT: 'invalid_port',
      PORT: 'invalid_port',
    });
    expect(env.API_PORT).toBe(3001);
  });

  it('should respect valid numeric and string ports', () => {
    const env1 = validateEnv({ ...baseValidEnv, API_PORT: 8080 });
    expect(env1.API_PORT).toBe(8080);

    const env2 = validateEnv({ ...baseValidEnv, API_PORT: '5000' });
    expect(env2.API_PORT).toBe(5000);
  });

  it('should safely handle optional empty or undefined fields', () => {
    const env = validateEnv({
      ...baseValidEnv,
      PAYMENT_WEBHOOK_SECRET: '',
      RESEND_API_KEY: 'undefined',
      S3_ENDPOINT: '',
      ALLOW_FIXED_TEST_OTP: 'true',
      OTP_CODE_LENGTH: '',
    });
    expect(env.PAYMENT_WEBHOOK_SECRET).toBe('');
    expect(env.RESEND_API_KEY).toBe('');
    expect(env.ALLOW_FIXED_TEST_OTP).toBe(true);
    expect(env.OTP_CODE_LENGTH).toBe(6);
  });

  it('should throw error if required secrets are missing', () => {
    expect(() => validateEnv({})).toThrow(/Invalid environment/);
    expect(() =>
      validateEnv({
        ...baseValidEnv,
        DATABASE_URL: '',
      }),
    ).toThrow(/Invalid environment/);
  });
});
