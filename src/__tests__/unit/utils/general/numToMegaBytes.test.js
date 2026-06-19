import { describe, expect, it } from 'vitest';

import numToMegaBytes from '../../../../utils/general/numToMegaBytes.js';

describe('numToMegaBytes', () => {
  it('converts 1 to 1 048 576 bytes', () => {
    expect(numToMegaBytes(1)).toBe(1_048_576);
  });

  it('converts 5 to 5 242 880 bytes', () => {
    expect(numToMegaBytes(5)).toBe(5_242_880);
  });

  it('returns 0 for 0 input', () => {
    expect(numToMegaBytes(0)).toBe(0);
  });

  it('handles fractional values', () => {
    expect(numToMegaBytes(0.5)).toBeCloseTo(524_288);
  });
});
