import { describe, expect, it } from 'vitest';

import { generateTemporaryPassword } from '../../../../utils/libs/randomPassword.js';

const UPPERCASE_RE = /[A-Z]/;
const LOWERCASE_RE = /[a-z]/;
const DIGITS_RE = /[0-9]/;
const SYMBOLS_RE = /[@#$%&*!?]/;

describe('generateTemporaryPassword', () => {
  it('returns a string', () => {
    expect(typeof generateTemporaryPassword()).toBe('string');
  });

  it('returns a string of length 12 by default', () => {
    expect(generateTemporaryPassword()).toHaveLength(12);
  });

  it('enforces minimum length of 8', () => {
    expect(generateTemporaryPassword(2)).toHaveLength(8);
  });

  it('enforces maximum length of 16', () => {
    expect(generateTemporaryPassword(100)).toHaveLength(16);
  });

  it('respects a length within the valid range', () => {
    expect(generateTemporaryPassword(10)).toHaveLength(10);
  });

  it('contains at least one uppercase letter', () => {
    const pwd = generateTemporaryPassword();
    expect(UPPERCASE_RE.test(pwd)).toBe(true);
  });

  it('contains at least one lowercase letter', () => {
    const pwd = generateTemporaryPassword();
    expect(LOWERCASE_RE.test(pwd)).toBe(true);
  });

  it('contains at least one digit', () => {
    const pwd = generateTemporaryPassword();
    expect(DIGITS_RE.test(pwd)).toBe(true);
  });

  it('contains at least one symbol', () => {
    const pwd = generateTemporaryPassword();
    expect(SYMBOLS_RE.test(pwd)).toBe(true);
  });

  it('produces different outputs on successive calls (probabilistic)', () => {
    const passwords = new Set(
      Array.from({ length: 10 }, () => generateTemporaryPassword()),
    );
    expect(passwords.size).toBeGreaterThan(1);
  });
});
