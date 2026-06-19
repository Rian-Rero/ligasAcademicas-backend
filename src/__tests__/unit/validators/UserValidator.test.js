import { describe, expect, it } from 'vitest';

import * as UserValidator from '../../../validators/UserValidator.js';

const VALID_OID = '507f1f77bcf86cd799439011';

function req(overrides = {}) {
  return { body: {}, params: {}, query: {}, signedCookies: {}, ...overrides };
}

describe('UserValidator.get', () => {
  it('accepts empty query', () => {
    expect(() => UserValidator.get(req())).not.toThrow();
  });

  it('accepts valid query with optional fields', () => {
    expect(() =>
      UserValidator.get(req({ query: { name: 'Alice' } })),
    ).not.toThrow();
  });
});

describe('UserValidator.getById', () => {
  it('accepts a valid ObjectId in params', () => {
    expect(() =>
      UserValidator.getById(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('throws when _id is not a valid ObjectId', () => {
    expect(() =>
      UserValidator.getById(req({ params: { _id: 'not-an-id' } })),
    ).toThrow();
  });
});

describe('UserValidator.create', () => {
  it('accepts valid name and email', () => {
    expect(() =>
      UserValidator.create(
        req({ body: { name: 'Alice', email: 'alice@test.com' } }),
      ),
    ).not.toThrow();
  });

  it('throws when name is missing', () => {
    expect(() =>
      UserValidator.create(req({ body: { email: 'alice@test.com' } })),
    ).toThrow();
  });

  it('throws when name is too short (< 3 chars)', () => {
    expect(() =>
      UserValidator.create(
        req({ body: { name: 'Al', email: 'alice@test.com' } }),
      ),
    ).toThrow();
  });

  it('throws when email is missing', () => {
    expect(() =>
      UserValidator.create(req({ body: { name: 'Alice' } })),
    ).toThrow();
  });

  it('throws when email is invalid', () => {
    expect(() =>
      UserValidator.create(
        req({ body: { name: 'Alice', email: 'not-email' } }),
      ),
    ).toThrow();
  });
});

describe('UserValidator.forgotPassword', () => {
  it('accepts a valid email', () => {
    expect(() =>
      UserValidator.forgotPassword(req({ body: { email: 'a@b.com' } })),
    ).not.toThrow();
  });

  it('throws when email is missing', () => {
    expect(() => UserValidator.forgotPassword(req())).toThrow();
  });
});

describe('UserValidator.changePassword', () => {
  it('accepts valid newPassword and _id', () => {
    expect(() =>
      UserValidator.changePassword(
        req({ body: { newPassword: 'NewPass1' }, params: { _id: VALID_OID } }),
      ),
    ).not.toThrow();
  });

  it('throws when newPassword is too short', () => {
    expect(() =>
      UserValidator.changePassword(
        req({ body: { newPassword: 'ab' }, params: { _id: VALID_OID } }),
      ),
    ).toThrow();
  });
});

describe('UserValidator.update', () => {
  it('accepts empty update body with valid _id', () => {
    expect(() =>
      UserValidator.update(req({ body: {}, params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('throws when _id is invalid', () => {
    expect(() =>
      UserValidator.update(req({ body: {}, params: { _id: 'bad' } })),
    ).toThrow();
  });
});

describe('UserValidator.destroy', () => {
  it('accepts a valid _id', () => {
    expect(() =>
      UserValidator.destroy(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });
});

describe('UserValidator.verifyEmail', () => {
  it('accepts a token param', () => {
    expect(() =>
      UserValidator.verifyEmail(req({ params: { token: 'sometoken' } })),
    ).not.toThrow();
  });

  it('throws when token is missing', () => {
    expect(() => UserValidator.verifyEmail(req({ params: {} }))).toThrow();
  });
});
