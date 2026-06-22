import { describe, expect, it } from 'vitest';

import * as LeagueMembershipValidator from '../../../validators/LeagueMembershipValidator.js';

const VALID_OID = '507f1f77bcf86cd799439011';
const VALID_OID_2 = '507f1f77bcf86cd799439012';
const INVALID_OID = 'not-an-objectid';

function req(overrides = {}) {
  return { body: {}, params: {}, query: {}, signedCookies: {}, ...overrides };
}

// ---------------------------------------------------------------------------
// get — queryBooleanSchema branches
// ---------------------------------------------------------------------------

describe('LeagueMembershipValidator.get', () => {
  it('accepts empty query', () => {
    const result = LeagueMembershipValidator.get(req());
    expect(result).toBeDefined();
  });

  it('parses isActive string "true" to boolean true', () => {
    const result = LeagueMembershipValidator.get(
      req({ query: { isActive: 'true' } }),
    );
    expect(result.isActive).toBe(true);
  });

  it('parses isActive string "false" to boolean false', () => {
    const result = LeagueMembershipValidator.get(
      req({ query: { isActive: 'false' } }),
    );
    expect(result.isActive).toBe(false);
  });

  it('parses isActive string "1" to boolean true', () => {
    const result = LeagueMembershipValidator.get(
      req({ query: { isActive: '1' } }),
    );
    expect(result.isActive).toBe(true);
  });

  it('parses isActive string "0" to boolean false', () => {
    const result = LeagueMembershipValidator.get(
      req({ query: { isActive: '0' } }),
    );
    expect(result.isActive).toBe(false);
  });

  it('passes isActive boolean true through unchanged', () => {
    const result = LeagueMembershipValidator.get(
      req({ query: { isActive: true } }),
    );
    expect(result.isActive).toBe(true);
  });

  it('passes isActive boolean false through unchanged', () => {
    const result = LeagueMembershipValidator.get(
      req({ query: { isActive: false } }),
    );
    expect(result.isActive).toBe(false);
  });

  it('accepts optional _id filter', () => {
    const result = LeagueMembershipValidator.get(
      req({ query: { _id: VALID_OID } }),
    );
    expect(result._id).toBe(VALID_OID);
  });

  it('accepts optional user filter', () => {
    const result = LeagueMembershipValidator.get(
      req({ query: { user: VALID_OID } }),
    );
    expect(result.user).toBe(VALID_OID);
  });

  it('accepts optional academicLeague filter', () => {
    const result = LeagueMembershipValidator.get(
      req({ query: { academicLeague: VALID_OID } }),
    );
    expect(result.academicLeague).toBe(VALID_OID);
  });

  it('accepts optional university filter', () => {
    const result = LeagueMembershipValidator.get(
      req({ query: { university: VALID_OID } }),
    );
    expect(result.university).toBe(VALID_OID);
  });

  it('accepts optional squad filter', () => {
    const result = LeagueMembershipValidator.get(
      req({ query: { squad: VALID_OID } }),
    );
    expect(result.squad).toBe(VALID_OID);
  });

  it('accepts optional role filter as string', () => {
    const result = LeagueMembershipValidator.get(
      req({ query: { role: 'manager' } }),
    );
    expect(result.role).toBe('manager');
  });

  it('accepts multiple optional filters combined', () => {
    const result = LeagueMembershipValidator.get(
      req({
        query: {
          user: VALID_OID,
          academicLeague: VALID_OID_2,
          isActive: 'true',
          role: 'member',
        },
      }),
    );
    expect(result.user).toBe(VALID_OID);
    expect(result.academicLeague).toBe(VALID_OID_2);
    expect(result.isActive).toBe(true);
    expect(result.role).toBe('member');
  });

  it('throws when isActive cannot be coerced to boolean', () => {
    expect(() =>
      LeagueMembershipValidator.get(req({ query: { isActive: 'maybe' } })),
    ).toThrow();
  });

  it('throws for invalid _id in query', () => {
    expect(() =>
      LeagueMembershipValidator.get(req({ query: { _id: INVALID_OID } })),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// getById
// ---------------------------------------------------------------------------

describe('LeagueMembershipValidator.getById', () => {
  it('accepts valid ObjectId', () => {
    const result = LeagueMembershipValidator.getById(
      req({ params: { _id: VALID_OID } }),
    );
    expect(result._id).toBe(VALID_OID);
  });

  it('throws for invalid ObjectId', () => {
    expect(() =>
      LeagueMembershipValidator.getById(req({ params: { _id: INVALID_OID } })),
    ).toThrow();
  });

  it('throws when _id is missing', () => {
    expect(() =>
      LeagueMembershipValidator.getById(req({ params: {} })),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

describe('LeagueMembershipValidator.create', () => {
  it('accepts valid body with academicLeague (league type)', () => {
    const result = LeagueMembershipValidator.create(
      req({
        body: {
          user: VALID_OID,
          academicLeague: VALID_OID,
          membershipType: 'league',
          role: 'member',
          isActive: true,
        },
      }),
    );
    expect(result.user).toBe(VALID_OID);
    expect(result.academicLeague).toBe(VALID_OID);
    expect(result.membershipType).toBe('league');
    expect(result.isActive).toBe(true);
  });

  it('accepts valid body with university (university type)', () => {
    const result = LeagueMembershipValidator.create(
      req({
        body: {
          user: VALID_OID,
          university: VALID_OID,
          membershipType: 'university',
          role: 'coordinator',
          isActive: false,
        },
      }),
    );
    expect(result.university).toBe(VALID_OID);
    expect(result.membershipType).toBe('university');
    expect(result.isActive).toBe(false);
  });

  it('accepts valid body without optional membershipType', () => {
    const result = LeagueMembershipValidator.create(
      req({
        body: {
          user: VALID_OID,
          role: 'member',
          isActive: true,
        },
      }),
    );
    expect(result.user).toBe(VALID_OID);
  });

  it('accepts valid body with squad', () => {
    const result = LeagueMembershipValidator.create(
      req({
        body: {
          user: VALID_OID,
          academicLeague: VALID_OID,
          squad: VALID_OID_2,
          role: 'captain',
          isActive: true,
        },
      }),
    );
    expect(result.squad).toBe(VALID_OID_2);
  });

  it('throws when user is missing', () => {
    expect(() =>
      LeagueMembershipValidator.create(
        req({ body: { role: 'member', isActive: true } }),
      ),
    ).toThrow();
  });

  it('throws when role is missing', () => {
    expect(() =>
      LeagueMembershipValidator.create(
        req({ body: { user: VALID_OID, isActive: true } }),
      ),
    ).toThrow();
  });

  it('throws when isActive is missing', () => {
    expect(() =>
      LeagueMembershipValidator.create(
        req({ body: { user: VALID_OID, role: 'member' } }),
      ),
    ).toThrow();
  });

  it('throws when role is too short', () => {
    expect(() =>
      LeagueMembershipValidator.create(
        req({ body: { user: VALID_OID, role: 'a', isActive: true } }),
      ),
    ).toThrow();
  });

  it('throws when role exceeds max length', () => {
    expect(() =>
      LeagueMembershipValidator.create(
        req({
          body: {
            user: VALID_OID,
            role: 'a'.repeat(81),
            isActive: true,
          },
        }),
      ),
    ).toThrow();
  });

  it('throws when user is an invalid ObjectId', () => {
    expect(() =>
      LeagueMembershipValidator.create(
        req({ body: { user: INVALID_OID, role: 'member', isActive: true } }),
      ),
    ).toThrow();
  });

  it('throws when membershipType is not a valid enum value', () => {
    expect(() =>
      LeagueMembershipValidator.create(
        req({
          body: {
            user: VALID_OID,
            membershipType: 'invalid',
            role: 'member',
            isActive: true,
          },
        }),
      ),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

describe('LeagueMembershipValidator.update', () => {
  it('accepts empty body with valid _id', () => {
    const result = LeagueMembershipValidator.update(
      req({ body: {}, params: { _id: VALID_OID } }),
    );
    expect(result._id).toBe(VALID_OID);
  });

  it('accepts partial update with isActive', () => {
    const result = LeagueMembershipValidator.update(
      req({ body: { isActive: false }, params: { _id: VALID_OID } }),
    );
    expect(result.isActive).toBe(false);
  });

  it('accepts partial update with role', () => {
    const result = LeagueMembershipValidator.update(
      req({ body: { role: 'coordinator' }, params: { _id: VALID_OID } }),
    );
    expect(result.role).toBe('coordinator');
  });

  it('accepts partial update with academicLeague', () => {
    const result = LeagueMembershipValidator.update(
      req({
        body: { academicLeague: VALID_OID_2 },
        params: { _id: VALID_OID },
      }),
    );
    expect(result.academicLeague).toBe(VALID_OID_2);
  });

  it('accepts partial update with university', () => {
    const result = LeagueMembershipValidator.update(
      req({ body: { university: VALID_OID_2 }, params: { _id: VALID_OID } }),
    );
    expect(result.university).toBe(VALID_OID_2);
  });

  it('throws when _id is invalid', () => {
    expect(() =>
      LeagueMembershipValidator.update(
        req({ body: {}, params: { _id: INVALID_OID } }),
      ),
    ).toThrow();
  });

  it('throws when _id is missing', () => {
    expect(() =>
      LeagueMembershipValidator.update(req({ body: {}, params: {} })),
    ).toThrow();
  });

  it('throws when role in body is too short', () => {
    expect(() =>
      LeagueMembershipValidator.update(
        req({ body: { role: 'a' }, params: { _id: VALID_OID } }),
      ),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// destroy
// ---------------------------------------------------------------------------

describe('LeagueMembershipValidator.destroy', () => {
  it('accepts valid _id', () => {
    const result = LeagueMembershipValidator.destroy(
      req({ params: { _id: VALID_OID } }),
    );
    expect(result._id).toBe(VALID_OID);
  });

  it('throws for invalid _id', () => {
    expect(() =>
      LeagueMembershipValidator.destroy(req({ params: { _id: INVALID_OID } })),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// getInactiveByLeague
// ---------------------------------------------------------------------------

describe('LeagueMembershipValidator.getInactiveByLeague', () => {
  it('accepts empty query', () => {
    const result = LeagueMembershipValidator.getInactiveByLeague(req());
    expect(result).toBeDefined();
  });

  it('accepts optional academicLeague filter', () => {
    const result = LeagueMembershipValidator.getInactiveByLeague(
      req({ query: { academicLeague: VALID_OID } }),
    );
    expect(result.academicLeague).toBe(VALID_OID);
  });

  it('accepts optional university filter', () => {
    const result = LeagueMembershipValidator.getInactiveByLeague(
      req({ query: { university: VALID_OID } }),
    );
    expect(result.university).toBe(VALID_OID);
  });

  it('accepts optional user filter', () => {
    const result = LeagueMembershipValidator.getInactiveByLeague(
      req({ query: { user: VALID_OID } }),
    );
    expect(result.user).toBe(VALID_OID);
  });

  it('accepts all optional filters combined', () => {
    const result = LeagueMembershipValidator.getInactiveByLeague(
      req({
        query: {
          academicLeague: VALID_OID,
          university: VALID_OID_2,
          user: VALID_OID,
        },
      }),
    );
    expect(result.academicLeague).toBe(VALID_OID);
    expect(result.university).toBe(VALID_OID_2);
    expect(result.user).toBe(VALID_OID);
  });

  it('throws for invalid academicLeague in query', () => {
    expect(() =>
      LeagueMembershipValidator.getInactiveByLeague(
        req({ query: { academicLeague: INVALID_OID } }),
      ),
    ).toThrow();
  });

  it('throws for invalid university in query', () => {
    expect(() =>
      LeagueMembershipValidator.getInactiveByLeague(
        req({ query: { university: INVALID_OID } }),
      ),
    ).toThrow();
  });
});
