import { describe, expect, it } from 'vitest';

import * as SessionValidator from '../../../validators/SessionValidator.js';

function req(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    signedCookies: {},
    ...overrides,
  };
}

describe('SessionValidator.login', () => {
  it('accepts a valid email and password', () => {
    expect(() =>
      SessionValidator.login(
        req({ body: { email: 'a@b.com', password: 'pass123' } }),
      ),
    ).not.toThrow();
  });

  it('throws when email is missing', () => {
    expect(() =>
      SessionValidator.login(req({ body: { password: 'pass123' } })),
    ).toThrow();
  });

  it('throws when email is invalid', () => {
    expect(() =>
      SessionValidator.login(
        req({ body: { email: 'not-an-email', password: 'pass123' } }),
      ),
    ).toThrow();
  });

  it('throws when password is missing', () => {
    expect(() =>
      SessionValidator.login(req({ body: { email: 'a@b.com' } })),
    ).toThrow();
  });

  it('returns token from signedCookies when present', () => {
    const result = SessionValidator.login(
      req({
        body: { email: 'a@b.com', password: 'pass' },
        signedCookies: { token: 'sometoken' },
      }),
    );
    expect(result.token).toBe('sometoken');
  });
});

describe('SessionValidator.logout', () => {
  it('accepts request without a cookie', () => {
    expect(() => SessionValidator.logout(req())).not.toThrow();
  });

  it('accepts request with a token cookie', () => {
    expect(() =>
      SessionValidator.logout(req({ signedCookies: { token: 'abc' } })),
    ).not.toThrow();
  });
});

describe('SessionValidator.refresh', () => {
  it('accepts request without a cookie', () => {
    expect(() => SessionValidator.refresh(req())).not.toThrow();
  });

  it('returns token from signedCookies', () => {
    const result = SessionValidator.refresh(
      req({ signedCookies: { token: 'mytoken' } }),
    );
    expect(result.token).toBe('mytoken');
  });
});
