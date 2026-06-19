import { describe, expect, it } from 'vitest';

import * as AttendanceValidator from '../../../validators/AttendanceValidator.js';

const VALID_OID = '507f1f77bcf86cd799439011';

function req(overrides = {}) {
  return { body: {}, params: {}, query: {}, signedCookies: {}, ...overrides };
}

const validCreate = {
  event: VALID_OID,
  leagueMembership: VALID_OID,
};

describe('AttendanceValidator.get', () => {
  it('accepts empty query', () => {
    expect(() => AttendanceValidator.get(req())).not.toThrow();
  });

  it('accepts optional filters', () => {
    expect(() =>
      AttendanceValidator.get(
        req({ query: { isConfirmed: 'true', hasAttended: 'false' } }),
      ),
    ).not.toThrow();
  });
});

describe('AttendanceValidator.getById', () => {
  it('accepts valid ObjectId', () => {
    expect(() =>
      AttendanceValidator.getById(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('throws for invalid ObjectId', () => {
    expect(() =>
      AttendanceValidator.getById(req({ params: { _id: 'bad' } })),
    ).toThrow();
  });
});

describe('AttendanceValidator.create', () => {
  it('accepts valid attendance data', () => {
    expect(() =>
      AttendanceValidator.create(req({ body: validCreate })),
    ).not.toThrow();
  });

  it('throws when event is missing', () => {
    const { event: _, ...rest } = validCreate;
    expect(() => AttendanceValidator.create(req({ body: rest }))).toThrow();
  });

  it('throws when leagueMembership is missing', () => {
    const { leagueMembership: _, ...rest } = validCreate;
    expect(() => AttendanceValidator.create(req({ body: rest }))).toThrow();
  });
});

describe('AttendanceValidator.update', () => {
  it('accepts empty body with valid _id', () => {
    expect(() =>
      AttendanceValidator.update(req({ body: {}, params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('accepts partial update', () => {
    expect(() =>
      AttendanceValidator.update(
        req({ body: { hasAttended: true }, params: { _id: VALID_OID } }),
      ),
    ).not.toThrow();
  });
});

describe('AttendanceValidator.confirm', () => {
  it('accepts valid _id', () => {
    expect(() =>
      AttendanceValidator.confirm(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });
});

describe('AttendanceValidator.markAttendance', () => {
  it('accepts valid _id with optional body', () => {
    expect(() =>
      AttendanceValidator.markAttendance(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('accepts _id with hasAttended flag', () => {
    expect(() =>
      AttendanceValidator.markAttendance(
        req({ body: { hasAttended: true }, params: { _id: VALID_OID } }),
      ),
    ).not.toThrow();
  });
});
