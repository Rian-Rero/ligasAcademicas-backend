import { describe, expect, it } from 'vitest';

import * as CertificateValidator from '../../../validators/CertificateValidator.js';

const VALID_OID = '507f1f77bcf86cd799439011';
const VALID_OID_2 = '507f1f77bcf86cd799439012';
const INVALID_OID = 'not-an-objectid';

function req(overrides = {}) {
  return { body: {}, params: {}, query: {}, signedCookies: {}, ...overrides };
}

const ISO_DATE = '2024-06-15T10:00:00.000Z';

// ---------------------------------------------------------------------------
// get — dateSchema and numberSchema preprocessors
// ---------------------------------------------------------------------------

describe('CertificateValidator.get', () => {
  it('accepts empty query', () => {
    const result = CertificateValidator.get(req());
    expect(result).toBeDefined();
  });

  it('parses issueDateFrom string to Date', () => {
    const result = CertificateValidator.get(
      req({ query: { issueDateFrom: ISO_DATE } }),
    );
    expect(result.issueDateFrom).toBeInstanceOf(Date);
    expect(result.issueDateFrom.toISOString()).toBe(ISO_DATE);
  });

  it('passes issueDateFrom Date instance through unchanged', () => {
    const dateObj = new Date(ISO_DATE);
    const result = CertificateValidator.get(
      req({ query: { issueDateFrom: dateObj } }),
    );
    expect(result.issueDateFrom).toBeInstanceOf(Date);
    expect(result.issueDateFrom.getTime()).toBe(dateObj.getTime());
  });

  it('parses issueDateTo string to Date', () => {
    const result = CertificateValidator.get(
      req({ query: { issueDateTo: '2024-12-31' } }),
    );
    expect(result.issueDateTo).toBeInstanceOf(Date);
  });

  it('passes issueDateTo Date instance through unchanged', () => {
    const dateObj = new Date('2024-12-31');
    const result = CertificateValidator.get(
      req({ query: { issueDateTo: dateObj } }),
    );
    expect(result.issueDateTo).toBeInstanceOf(Date);
  });

  it('throws for invalid issueDateFrom string', () => {
    expect(() =>
      CertificateValidator.get(req({ query: { issueDateFrom: 'not-a-date' } })),
    ).toThrow();
  });

  it('parses minWorkLoadHours string number to number', () => {
    const result = CertificateValidator.get(
      req({ query: { minWorkLoadHours: '20' } }),
    );
    expect(result.minWorkLoadHours).toBe(20);
  });

  it('passes minWorkLoadHours as number through unchanged', () => {
    const result = CertificateValidator.get(
      req({ query: { minWorkLoadHours: 20 } }),
    );
    expect(result.minWorkLoadHours).toBe(20);
  });

  it('parses maxWorkLoadHours string number to number', () => {
    const result = CertificateValidator.get(
      req({ query: { maxWorkLoadHours: '100' } }),
    );
    expect(result.maxWorkLoadHours).toBe(100);
  });

  it('throws for non-numeric minWorkLoadHours string', () => {
    expect(() =>
      CertificateValidator.get(req({ query: { minWorkLoadHours: 'many' } })),
    ).toThrow();
  });

  it('accepts leagueMembership as single ObjectId string', () => {
    const result = CertificateValidator.get(
      req({ query: { leagueMembership: VALID_OID } }),
    );
    expect(result.leagueMembership).toBe(VALID_OID);
  });

  it('accepts leagueMembership as array of ObjectIds', () => {
    const result = CertificateValidator.get(
      req({ query: { leagueMembership: [VALID_OID, VALID_OID_2] } }),
    );
    expect(Array.isArray(result.leagueMembership)).toBe(true);
    expect(result.leagueMembership).toHaveLength(2);
  });

  it('accepts optional _id filter', () => {
    const result = CertificateValidator.get(req({ query: { _id: VALID_OID } }));
    expect(result._id).toBe(VALID_OID);
  });

  it('accepts optional pdfUrl filter', () => {
    const result = CertificateValidator.get(
      req({ query: { pdfUrl: 'https://example.com/cert.pdf' } }),
    );
    expect(result.pdfUrl).toBe('https://example.com/cert.pdf');
  });

  it('accepts combined date and workload filters', () => {
    const result = CertificateValidator.get(
      req({
        query: {
          issueDateFrom: '2024-01-01',
          issueDateTo: '2024-12-31',
          minWorkLoadHours: '10',
          maxWorkLoadHours: '200',
        },
      }),
    );
    expect(result.issueDateFrom).toBeInstanceOf(Date);
    expect(result.issueDateTo).toBeInstanceOf(Date);
    expect(result.minWorkLoadHours).toBe(10);
    expect(result.maxWorkLoadHours).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// getById
// ---------------------------------------------------------------------------

describe('CertificateValidator.getById', () => {
  it('accepts valid ObjectId', () => {
    const result = CertificateValidator.getById(
      req({ params: { _id: VALID_OID } }),
    );
    expect(result._id).toBe(VALID_OID);
  });

  it('throws for invalid ObjectId', () => {
    expect(() =>
      CertificateValidator.getById(req({ params: { _id: INVALID_OID } })),
    ).toThrow();
  });

  it('throws when _id is missing', () => {
    expect(() => CertificateValidator.getById(req({ params: {} }))).toThrow();
  });
});

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

describe('CertificateValidator.create', () => {
  it('accepts valid certificate data', () => {
    const result = CertificateValidator.create(
      req({
        body: {
          leagueMembership: VALID_OID,
          workLoadHours: 40,
          issueDate: ISO_DATE,
        },
      }),
    );
    expect(result.leagueMembership).toBe(VALID_OID);
    expect(result.workLoadHours).toBe(40);
    expect(result.issueDate).toBeInstanceOf(Date);
  });

  it('accepts valid body with pdfUrl', () => {
    const result = CertificateValidator.create(
      req({
        body: {
          leagueMembership: VALID_OID,
          workLoadHours: 40,
          issueDate: ISO_DATE,
          pdfUrl: 'https://example.com/cert.pdf',
        },
      }),
    );
    expect(result.pdfUrl).toBe('https://example.com/cert.pdf');
  });

  it('accepts valid body without pdfUrl', () => {
    const result = CertificateValidator.create(
      req({
        body: {
          leagueMembership: VALID_OID,
          workLoadHours: 40,
          issueDate: ISO_DATE,
        },
      }),
    );
    expect(result.pdfUrl).toBeUndefined();
  });

  it('parses workLoadHours string number to number', () => {
    const result = CertificateValidator.create(
      req({
        body: {
          leagueMembership: VALID_OID,
          workLoadHours: '40',
          issueDate: ISO_DATE,
        },
      }),
    );
    expect(result.workLoadHours).toBe(40);
  });

  it('rounds workLoadHours to 2 decimal places via transform', () => {
    const result = CertificateValidator.create(
      req({
        body: {
          leagueMembership: VALID_OID,
          workLoadHours: 40.999,
          issueDate: ISO_DATE,
        },
      }),
    );
    expect(result.workLoadHours).toBe(41);
  });

  it('throws when workLoadHours is 0 (not positive)', () => {
    expect(() =>
      CertificateValidator.create(
        req({
          body: {
            leagueMembership: VALID_OID,
            workLoadHours: 0,
            issueDate: ISO_DATE,
          },
        }),
      ),
    ).toThrow();
  });

  it('throws when workLoadHours is negative', () => {
    expect(() =>
      CertificateValidator.create(
        req({
          body: {
            leagueMembership: VALID_OID,
            workLoadHours: -10,
            issueDate: ISO_DATE,
          },
        }),
      ),
    ).toThrow();
  });

  it('throws when leagueMembership is missing', () => {
    expect(() =>
      CertificateValidator.create(
        req({ body: { workLoadHours: 40, issueDate: ISO_DATE } }),
      ),
    ).toThrow();
  });

  it('throws when leagueMembership is an invalid ObjectId', () => {
    expect(() =>
      CertificateValidator.create(
        req({
          body: {
            leagueMembership: INVALID_OID,
            workLoadHours: 40,
            issueDate: ISO_DATE,
          },
        }),
      ),
    ).toThrow();
  });

  it('throws when issueDate is missing', () => {
    expect(() =>
      CertificateValidator.create(
        req({ body: { leagueMembership: VALID_OID, workLoadHours: 40 } }),
      ),
    ).toThrow();
  });

  it('throws when issueDate is an invalid date string', () => {
    expect(() =>
      CertificateValidator.create(
        req({
          body: {
            leagueMembership: VALID_OID,
            workLoadHours: 40,
            issueDate: 'not-a-date',
          },
        }),
      ),
    ).toThrow();
  });

  it('accepts issueDate as Date instance directly', () => {
    const dateObj = new Date(ISO_DATE);
    const result = CertificateValidator.create(
      req({
        body: {
          leagueMembership: VALID_OID,
          workLoadHours: 40,
          issueDate: dateObj,
        },
      }),
    );
    expect(result.issueDate).toBeInstanceOf(Date);
    expect(result.issueDate.getTime()).toBe(dateObj.getTime());
  });

  it('throws when pdfUrl is too short', () => {
    expect(() =>
      CertificateValidator.create(
        req({
          body: {
            leagueMembership: VALID_OID,
            workLoadHours: 40,
            issueDate: ISO_DATE,
            pdfUrl: 'ab',
          },
        }),
      ),
    ).toThrow();
  });

  it('throws when workLoadHours is missing', () => {
    expect(() =>
      CertificateValidator.create(
        req({ body: { leagueMembership: VALID_OID, issueDate: ISO_DATE } }),
      ),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

describe('CertificateValidator.update', () => {
  it('accepts empty body with valid _id', () => {
    const result = CertificateValidator.update(
      req({ body: {}, params: { _id: VALID_OID } }),
    );
    expect(result._id).toBe(VALID_OID);
  });

  it('accepts partial update with workLoadHours', () => {
    const result = CertificateValidator.update(
      req({ body: { workLoadHours: 80 }, params: { _id: VALID_OID } }),
    );
    expect(result.workLoadHours).toBe(80);
  });

  it('accepts partial update with issueDate string', () => {
    const result = CertificateValidator.update(
      req({ body: { issueDate: ISO_DATE }, params: { _id: VALID_OID } }),
    );
    expect(result.issueDate).toBeInstanceOf(Date);
  });

  it('accepts partial update with pdfUrl', () => {
    const result = CertificateValidator.update(
      req({
        body: { pdfUrl: 'https://example.com/new.pdf' },
        params: { _id: VALID_OID },
      }),
    );
    expect(result.pdfUrl).toBe('https://example.com/new.pdf');
  });

  it('accepts partial update with leagueMembership', () => {
    const result = CertificateValidator.update(
      req({
        body: { leagueMembership: VALID_OID_2 },
        params: { _id: VALID_OID },
      }),
    );
    expect(result.leagueMembership).toBe(VALID_OID_2);
  });

  it('throws when params._id is invalid', () => {
    expect(() =>
      CertificateValidator.update(
        req({ body: {}, params: { _id: INVALID_OID } }),
      ),
    ).toThrow();
  });

  it('throws when params._id is missing', () => {
    expect(() =>
      CertificateValidator.update(req({ body: {}, params: {} })),
    ).toThrow();
  });

  it('throws when workLoadHours in body is 0', () => {
    expect(() =>
      CertificateValidator.update(
        req({ body: { workLoadHours: 0 }, params: { _id: VALID_OID } }),
      ),
    ).toThrow();
  });

  it('throws when workLoadHours in body is negative', () => {
    expect(() =>
      CertificateValidator.update(
        req({ body: { workLoadHours: -5 }, params: { _id: VALID_OID } }),
      ),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// destroy
// ---------------------------------------------------------------------------

describe('CertificateValidator.destroy', () => {
  it('accepts valid _id', () => {
    const result = CertificateValidator.destroy(
      req({ params: { _id: VALID_OID } }),
    );
    expect(result._id).toBe(VALID_OID);
  });

  it('throws for invalid _id', () => {
    expect(() =>
      CertificateValidator.destroy(req({ params: { _id: INVALID_OID } })),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// getLatestByLeagueMembership
// ---------------------------------------------------------------------------

describe('CertificateValidator.getLatestByLeagueMembership', () => {
  it('accepts valid leagueMembership param', () => {
    const result = CertificateValidator.getLatestByLeagueMembership(
      req({ params: { leagueMembership: VALID_OID } }),
    );
    expect(result.leagueMembership).toBe(VALID_OID);
  });

  it('throws when leagueMembership param is missing', () => {
    expect(() =>
      CertificateValidator.getLatestByLeagueMembership(req({ params: {} })),
    ).toThrow();
  });

  it('throws when leagueMembership param is invalid ObjectId', () => {
    expect(() =>
      CertificateValidator.getLatestByLeagueMembership(
        req({ params: { leagueMembership: INVALID_OID } }),
      ),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// getSummaryByLeagueMembership
// ---------------------------------------------------------------------------

describe('CertificateValidator.getSummaryByLeagueMembership', () => {
  it('accepts valid leagueMembership param', () => {
    const result = CertificateValidator.getSummaryByLeagueMembership(
      req({ params: { leagueMembership: VALID_OID } }),
    );
    expect(result.leagueMembership).toBe(VALID_OID);
  });

  it('throws when leagueMembership param is missing', () => {
    expect(() =>
      CertificateValidator.getSummaryByLeagueMembership(req({ params: {} })),
    ).toThrow();
  });

  it('throws when leagueMembership param is invalid ObjectId', () => {
    expect(() =>
      CertificateValidator.getSummaryByLeagueMembership(
        req({ params: { leagueMembership: INVALID_OID } }),
      ),
    ).toThrow();
  });
});
