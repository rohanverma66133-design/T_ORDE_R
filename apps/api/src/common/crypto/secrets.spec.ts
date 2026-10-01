import { describe, expect, it } from '@jest/globals';
import { generateNumericCode, parseDurationToSeconds } from './secrets';

describe('secrets helpers', () => {
  it('generates a zero-padded numeric code of the requested length', () => {
    const code = generateNumericCode(6);
    expect(code).toMatch(/^\d{6}$/);
  });

  it('parses duration strings into seconds', () => {
    expect(parseDurationToSeconds('15m')).toBe(900);
    expect(parseDurationToSeconds('7d')).toBe(604800);
  });
});
