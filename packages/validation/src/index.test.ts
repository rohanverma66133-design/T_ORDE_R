import { describe, expect, it } from 'vitest';
import { requestOtpSchema } from './index';

describe('requestOtpSchema', () => {
  it('accepts a valid phone login request', () => {
    const parsed = requestOtpSchema.parse({
      channel: 'PHONE',
      destination: '+919876543210',
      purpose: 'LOGIN',
    });
    expect(parsed.channel).toBe('PHONE');
  });

  it('rejects an empty destination', () => {
    const result = requestOtpSchema.safeParse({
      channel: 'EMAIL',
      destination: '',
    });
    expect(result.success).toBe(false);
  });
});
