import { describe, expect, it } from 'vitest';

import {
  cookieAuthName,
  createCookieOptions,
  deleteCookieOptions,
} from '../../../../utils/general/cookieAuth.js';

describe('cookieAuth', () => {
  it('exports cookieAuthName equal to "token"', () => {
    expect(cookieAuthName).toBe('token');
  });

  it('deleteCookieOptions has httpOnly set to true', () => {
    expect(deleteCookieOptions.httpOnly).toBe(true);
  });

  it('deleteCookieOptions has signed set to true', () => {
    expect(deleteCookieOptions.signed).toBe(true);
  });

  it('createCookieOptions spreads all deleteCookieOptions properties', () => {
    expect(createCookieOptions.httpOnly).toBe(deleteCookieOptions.httpOnly);
    expect(createCookieOptions.signed).toBe(deleteCookieOptions.signed);
    expect(createCookieOptions.sameSite).toBe(deleteCookieOptions.sameSite);
  });

  it('createCookieOptions includes a maxAge property', () => {
    expect(createCookieOptions).toHaveProperty('maxAge');
  });
});
