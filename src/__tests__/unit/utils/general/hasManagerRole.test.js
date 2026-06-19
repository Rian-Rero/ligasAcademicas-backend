import { describe, expect, it } from 'vitest';

import { hasManagerRole } from '../../../../utils/general/hasManagerRole.js';

describe('hasManagerRole', () => {
  it('returns true for "admin"', () => {
    expect(hasManagerRole('admin')).toBe(true);
  });

  it('returns true for "manager"', () => {
    expect(hasManagerRole('manager')).toBe(true);
  });

  it('returns true for uppercase "ADMIN"', () => {
    expect(hasManagerRole('ADMIN')).toBe(true);
  });

  it('returns true for mixed-case "Admin"', () => {
    expect(hasManagerRole('Admin')).toBe(true);
  });

  it('returns true when keyword is embedded in a longer role name', () => {
    expect(hasManagerRole('event_manager')).toBe(true);
  });

  it('returns false for "member"', () => {
    expect(hasManagerRole('member')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(hasManagerRole('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(hasManagerRole(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(hasManagerRole(undefined)).toBe(false);
  });

  it('returns false for a role with no matching keyword', () => {
    expect(hasManagerRole('student')).toBe(false);
  });
});
