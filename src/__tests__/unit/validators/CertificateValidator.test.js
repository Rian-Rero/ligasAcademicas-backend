import { describe, expect, it } from 'vitest';

import * as CertificateValidator from '../../../validators/CertificateValidator.js';

const VALID_OID = '507f1f77bcf86cd799439011';

function req(overrides = {}) {
  return { body: {}, params: {}, query: {}, signedCookies: {}, ...overrides };
}

const validCreate = {
  leagueMembership: VALID_OID,
  workLoadHours: 40,
  issueDate: new Date().toISOString(),
};

describe('CertificateValidator.get', () => {
  it('accepts empty query', () => {
    expect(() => CertificateValidator.get(req())).not.toThrow();
  });

  it('accepts optional filters', () => {
    expect(() =>
      CertificateValidator.get(
        req({ query: { leagueMembership: VALID_OID, minWorkLoadHours: '20' } }),
      ),
    ).not.toThrow();
  });
});

describe('CertificateValidator.getById', () => {
  it('accepts valid ObjectId', () => {
    expect(() =>
      CertificateValidator.getById(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('throws for invalid ObjectId', () => {
    expect(() =>
      CertificateValidator.getById(req({ params: { _id: 'bad' } })),
    ).toThrow();
  });
});

describe('CertificateValidator.create', () => {
  it('accepts valid certificate data', () => {
    expect(() =>
      CertificateValidator.create(req({ body: validCreate })),
    ).not.toThrow();
  });

  it('throws when leagueMembership is missing', () => {
    const { leagueMembership: _, ...rest } = validCreate;
    expect(() => CertificateValidator.create(req({ body: rest }))).toThrow();
  });

  it('throws when workLoadHours is 0', () => {
    expect(() =>
      CertificateValidator.create(
        req({ body: { ...validCreate, workLoadHours: 0 } }),
      ),
    ).toThrow();
  });

  it('throws when issueDate is missing', () => {
    const { issueDate: _, ...rest } = validCreate;
    expect(() => CertificateValidator.create(req({ body: rest }))).toThrow();
  });
});

describe('CertificateValidator.update', () => {
  it('accepts empty body with valid _id', () => {
    expect(() =>
      CertificateValidator.update(
        req({ body: {}, params: { _id: VALID_OID } }),
      ),
    ).not.toThrow();
  });

  it('throws when _id is invalid', () => {
    expect(() =>
      CertificateValidator.update(req({ body: {}, params: { _id: 'bad' } })),
    ).toThrow();
  });
});

describe('CertificateValidator.getLatestByLeagueMembership', () => {
  it('accepts valid leagueMembership param', () => {
    expect(() =>
      CertificateValidator.getLatestByLeagueMembership(
        req({ params: { leagueMembership: VALID_OID } }),
      ),
    ).not.toThrow();
  });

  it('throws when leagueMembership is missing', () => {
    expect(() =>
      CertificateValidator.getLatestByLeagueMembership(req({ params: {} })),
    ).toThrow();
  });
});
