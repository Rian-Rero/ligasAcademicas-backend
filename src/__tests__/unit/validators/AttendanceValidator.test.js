import { describe, expect, it } from 'vitest';

import * as AttendanceValidator from '../../../validators/AttendanceValidator.js';

const VALID_OID = '507f1f77bcf86cd799439011';
const INVALID_OID = 'not-an-objectid';

function req(overrides = {}) {
  return { body: {}, params: {}, query: {}, signedCookies: {}, ...overrides };
}

const validCreate = {
  event: VALID_OID,
  leagueMembership: VALID_OID,
};

// ---------------------------------------------------------------------------
// get — queryBooleanSchema branches
// ---------------------------------------------------------------------------

describe('AttendanceValidator.get', () => {
  it('accepts empty query', () => {
    const result = AttendanceValidator.get(req());
    expect(result).toBeDefined();
  });

  it('parses isConfirmed string "true" to boolean true', () => {
    const result = AttendanceValidator.get(
      req({ query: { isConfirmed: 'true' } }),
    );
    expect(result.isConfirmed).toBe(true);
  });

  it('parses isConfirmed string "false" to boolean false', () => {
    const result = AttendanceValidator.get(
      req({ query: { isConfirmed: 'false' } }),
    );
    expect(result.isConfirmed).toBe(false);
  });

  it('parses isConfirmed string "1" to boolean true', () => {
    const result = AttendanceValidator.get(
      req({ query: { isConfirmed: '1' } }),
    );
    expect(result.isConfirmed).toBe(true);
  });

  it('parses isConfirmed string "0" to boolean false', () => {
    const result = AttendanceValidator.get(
      req({ query: { isConfirmed: '0' } }),
    );
    expect(result.isConfirmed).toBe(false);
  });

  it('passes isConfirmed boolean true through unchanged', () => {
    const result = AttendanceValidator.get(
      req({ query: { isConfirmed: true } }),
    );
    expect(result.isConfirmed).toBe(true);
  });

  it('passes isConfirmed boolean false through unchanged', () => {
    const result = AttendanceValidator.get(
      req({ query: { isConfirmed: false } }),
    );
    expect(result.isConfirmed).toBe(false);
  });

  it('parses hasAttended string "true" to boolean true', () => {
    const result = AttendanceValidator.get(
      req({ query: { hasAttended: 'true' } }),
    );
    expect(result.hasAttended).toBe(true);
  });

  it('parses hasAttended string "false" to boolean false', () => {
    const result = AttendanceValidator.get(
      req({ query: { hasAttended: 'false' } }),
    );
    expect(result.hasAttended).toBe(false);
  });

  it('parses hasAttended string "1" to boolean true', () => {
    const result = AttendanceValidator.get(
      req({ query: { hasAttended: '1' } }),
    );
    expect(result.hasAttended).toBe(true);
  });

  it('parses hasAttended string "0" to boolean false', () => {
    const result = AttendanceValidator.get(
      req({ query: { hasAttended: '0' } }),
    );
    expect(result.hasAttended).toBe(false);
  });

  it('accepts optional _id filter', () => {
    const result = AttendanceValidator.get(req({ query: { _id: VALID_OID } }));
    expect(result._id).toBe(VALID_OID);
  });

  it('accepts optional event filter', () => {
    const result = AttendanceValidator.get(
      req({ query: { event: VALID_OID } }),
    );
    expect(result.event).toBe(VALID_OID);
  });

  it('accepts optional leagueMembership filter', () => {
    const result = AttendanceValidator.get(
      req({ query: { leagueMembership: VALID_OID } }),
    );
    expect(result.leagueMembership).toBe(VALID_OID);
  });

  it('throws for invalid _id in query', () => {
    expect(() =>
      AttendanceValidator.get(req({ query: { _id: INVALID_OID } })),
    ).toThrow();
  });

  it('throws when isConfirmed cannot be coerced to boolean', () => {
    expect(() =>
      AttendanceValidator.get(req({ query: { isConfirmed: 'maybe' } })),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// getById
// ---------------------------------------------------------------------------

describe('AttendanceValidator.getById', () => {
  it('accepts valid ObjectId', () => {
    const result = AttendanceValidator.getById(
      req({ params: { _id: VALID_OID } }),
    );
    expect(result._id).toBe(VALID_OID);
  });

  it('throws for invalid ObjectId', () => {
    expect(() =>
      AttendanceValidator.getById(req({ params: { _id: INVALID_OID } })),
    ).toThrow();
  });

  it('throws when _id is missing', () => {
    expect(() => AttendanceValidator.getById(req({ params: {} }))).toThrow();
  });
});

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

describe('AttendanceValidator.create', () => {
  it('accepts valid attendance data', () => {
    const result = AttendanceValidator.create(req({ body: validCreate }));
    expect(result.event).toBe(VALID_OID);
    expect(result.leagueMembership).toBe(VALID_OID);
  });

  it('defaults isConfirmed to false when not provided', () => {
    const result = AttendanceValidator.create(req({ body: validCreate }));
    expect(result.isConfirmed).toBe(false);
  });

  it('defaults hasAttended to false when not provided', () => {
    const result = AttendanceValidator.create(req({ body: validCreate }));
    expect(result.hasAttended).toBe(false);
  });

  it('accepts explicit isConfirmed true', () => {
    const result = AttendanceValidator.create(
      req({ body: { ...validCreate, isConfirmed: true } }),
    );
    expect(result.isConfirmed).toBe(true);
  });

  it('accepts explicit hasAttended true', () => {
    const result = AttendanceValidator.create(
      req({ body: { ...validCreate, hasAttended: true } }),
    );
    expect(result.hasAttended).toBe(true);
  });

  it('throws when event is missing', () => {
    const { event: _, ...rest } = validCreate;
    expect(() => AttendanceValidator.create(req({ body: rest }))).toThrow();
  });

  it('throws when leagueMembership is missing', () => {
    const { leagueMembership: _, ...rest } = validCreate;
    expect(() => AttendanceValidator.create(req({ body: rest }))).toThrow();
  });

  it('throws when event is an invalid ObjectId', () => {
    expect(() =>
      AttendanceValidator.create(
        req({ body: { ...validCreate, event: INVALID_OID } }),
      ),
    ).toThrow();
  });

  it('throws when leagueMembership is an invalid ObjectId', () => {
    expect(() =>
      AttendanceValidator.create(
        req({ body: { ...validCreate, leagueMembership: INVALID_OID } }),
      ),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

describe('AttendanceValidator.update', () => {
  it('accepts empty body with valid _id', () => {
    const result = AttendanceValidator.update(
      req({ body: {}, params: { _id: VALID_OID } }),
    );
    expect(result._id).toBe(VALID_OID);
  });

  it('accepts partial update with event', () => {
    const result = AttendanceValidator.update(
      req({ body: { event: VALID_OID }, params: { _id: VALID_OID } }),
    );
    expect(result.event).toBe(VALID_OID);
  });

  it('accepts partial update with leagueMembership', () => {
    const result = AttendanceValidator.update(
      req({
        body: { leagueMembership: VALID_OID },
        params: { _id: VALID_OID },
      }),
    );
    expect(result.leagueMembership).toBe(VALID_OID);
  });

  it('accepts partial update with isConfirmed', () => {
    const result = AttendanceValidator.update(
      req({ body: { isConfirmed: true }, params: { _id: VALID_OID } }),
    );
    expect(result.isConfirmed).toBe(true);
  });

  it('accepts partial update with hasAttended', () => {
    const result = AttendanceValidator.update(
      req({ body: { hasAttended: false }, params: { _id: VALID_OID } }),
    );
    expect(result.hasAttended).toBe(false);
  });

  it('throws when params._id is invalid', () => {
    expect(() =>
      AttendanceValidator.update(
        req({ body: {}, params: { _id: INVALID_OID } }),
      ),
    ).toThrow();
  });

  it('throws when params._id is missing', () => {
    expect(() =>
      AttendanceValidator.update(req({ body: {}, params: {} })),
    ).toThrow();
  });

  it('throws when event in body is an invalid ObjectId', () => {
    expect(() =>
      AttendanceValidator.update(
        req({ body: { event: INVALID_OID }, params: { _id: VALID_OID } }),
      ),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// destroy
// ---------------------------------------------------------------------------

describe('AttendanceValidator.destroy', () => {
  it('accepts valid _id', () => {
    const result = AttendanceValidator.destroy(
      req({ params: { _id: VALID_OID } }),
    );
    expect(result._id).toBe(VALID_OID);
  });

  it('throws for invalid _id', () => {
    expect(() =>
      AttendanceValidator.destroy(req({ params: { _id: INVALID_OID } })),
    ).toThrow();
  });

  it('throws when _id is missing', () => {
    expect(() => AttendanceValidator.destroy(req({ params: {} }))).toThrow();
  });
});

// ---------------------------------------------------------------------------
// confirm
// ---------------------------------------------------------------------------

describe('AttendanceValidator.confirm', () => {
  it('accepts valid _id', () => {
    const result = AttendanceValidator.confirm(
      req({ params: { _id: VALID_OID } }),
    );
    expect(result._id).toBe(VALID_OID);
  });

  it('throws for invalid _id', () => {
    expect(() =>
      AttendanceValidator.confirm(req({ params: { _id: INVALID_OID } })),
    ).toThrow();
  });

  it('throws when _id is missing', () => {
    expect(() => AttendanceValidator.confirm(req({ params: {} }))).toThrow();
  });
});

// ---------------------------------------------------------------------------
// markAttendance
// ---------------------------------------------------------------------------

describe('AttendanceValidator.markAttendance', () => {
  it('accepts valid _id with no body', () => {
    const result = AttendanceValidator.markAttendance(
      req({ params: { _id: VALID_OID } }),
    );
    expect(result._id).toBe(VALID_OID);
  });

  it('accepts _id with hasAttended true', () => {
    const result = AttendanceValidator.markAttendance(
      req({ body: { hasAttended: true }, params: { _id: VALID_OID } }),
    );
    expect(result.hasAttended).toBe(true);
    expect(result._id).toBe(VALID_OID);
  });

  it('accepts _id with hasAttended false', () => {
    const result = AttendanceValidator.markAttendance(
      req({ body: { hasAttended: false }, params: { _id: VALID_OID } }),
    );
    expect(result.hasAttended).toBe(false);
  });

  it('throws for invalid params._id', () => {
    expect(() =>
      AttendanceValidator.markAttendance(req({ params: { _id: INVALID_OID } })),
    ).toThrow();
  });

  it('throws when params._id is missing', () => {
    expect(() =>
      AttendanceValidator.markAttendance(req({ params: {} })),
    ).toThrow();
  });
});
