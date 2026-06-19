import { describe, expect, it } from 'vitest';

import * as LeagueMembershipValidator from '../../../validators/LeagueMembershipValidator.js';

const VALID_OID = '507f1f77bcf86cd799439011';

function req(overrides = {}) {
  return { body: {}, params: {}, query: {}, signedCookies: {}, ...overrides };
}

const validCreate = {
  user: VALID_OID,
  academicLeague: VALID_OID,
  role: 'member',
  isActive: true,
};

describe('LeagueMembershipValidator.get', () => {
  it('accepts empty query', () => {
    expect(() => LeagueMembershipValidator.get(req())).not.toThrow();
  });

  it('accepts optional filters', () => {
    expect(() =>
      LeagueMembershipValidator.get(
        req({ query: { isActive: 'true', role: 'manager' } }),
      ),
    ).not.toThrow();
  });
});

describe('LeagueMembershipValidator.getById', () => {
  it('accepts valid ObjectId', () => {
    expect(() =>
      LeagueMembershipValidator.getById(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('throws for invalid ObjectId', () => {
    expect(() =>
      LeagueMembershipValidator.getById(req({ params: { _id: 'bad' } })),
    ).toThrow();
  });
});

describe('LeagueMembershipValidator.create', () => {
  it('accepts valid membership data', () => {
    expect(() =>
      LeagueMembershipValidator.create(req({ body: validCreate })),
    ).not.toThrow();
  });

  it('throws when user is missing', () => {
    const { user: _, ...rest } = validCreate;
    expect(() =>
      LeagueMembershipValidator.create(req({ body: rest })),
    ).toThrow();
  });

  it('throws when role is missing', () => {
    const { role: _, ...rest } = validCreate;
    expect(() =>
      LeagueMembershipValidator.create(req({ body: rest })),
    ).toThrow();
  });

  it('throws when isActive is missing', () => {
    const { isActive: _, ...rest } = validCreate;
    expect(() =>
      LeagueMembershipValidator.create(req({ body: rest })),
    ).toThrow();
  });
});

describe('LeagueMembershipValidator.update', () => {
  it('accepts empty body with valid _id', () => {
    expect(() =>
      LeagueMembershipValidator.update(
        req({ body: {}, params: { _id: VALID_OID } }),
      ),
    ).not.toThrow();
  });

  it('accepts partial update', () => {
    expect(() =>
      LeagueMembershipValidator.update(
        req({ body: { isActive: false }, params: { _id: VALID_OID } }),
      ),
    ).not.toThrow();
  });

  it('throws when _id is invalid', () => {
    expect(() =>
      LeagueMembershipValidator.update(
        req({ body: {}, params: { _id: 'bad' } }),
      ),
    ).toThrow();
  });
});

describe('LeagueMembershipValidator.destroy', () => {
  it('accepts valid _id', () => {
    expect(() =>
      LeagueMembershipValidator.destroy(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });
});
