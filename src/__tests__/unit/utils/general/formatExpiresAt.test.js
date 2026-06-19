import { describe, expect, it } from 'vitest';

import formatExpiresAt from '../../../../utils/general/formatExpiresAt.js';

describe('formatExpiresAt', () => {
  it('returns a timestamp roughly equal to now + given seconds converted to ms', () => {
    const before = Date.now();
    const result = formatExpiresAt(3600);
    const after = Date.now();

    expect(result).toBeGreaterThanOrEqual(before + 3_600_000);
    expect(result).toBeLessThanOrEqual(after + 3_600_000);
  });

  it('returns approximately now when 0 seconds are given', () => {
    const before = Date.now();
    const result = formatExpiresAt(0);
    const after = Date.now();

    expect(result).toBeGreaterThanOrEqual(before);
    expect(result).toBeLessThanOrEqual(after);
  });

  it('handles large values without overflow', () => {
    const result = formatExpiresAt(86400 * 365);
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(Date.now());
  });
});
