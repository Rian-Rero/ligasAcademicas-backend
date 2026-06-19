import { describe, expect, it } from 'vitest';

import * as AcademicLeagueValidator from '../../../validators/AcademicLeagueValidator.js';

const VALID_OID = '507f1f77bcf86cd799439011';

function req(overrides = {}) {
  return { body: {}, params: {}, query: {}, signedCookies: {}, ...overrides };
}

describe('AcademicLeagueValidator.get', () => {
  it('accepts empty query', () => {
    expect(() => AcademicLeagueValidator.get(req())).not.toThrow();
  });

  it('accepts query with optional name', () => {
    expect(() =>
      AcademicLeagueValidator.get(
        req({ query: { name: 'Liga de Cardiologia' } }),
      ),
    ).not.toThrow();
  });
});

describe('AcademicLeagueValidator.getById', () => {
  it('accepts valid ObjectId', () => {
    expect(() =>
      AcademicLeagueValidator.getById(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('throws for invalid ObjectId', () => {
    expect(() =>
      AcademicLeagueValidator.getById(req({ params: { _id: 'bad' } })),
    ).toThrow();
  });
});

describe('AcademicLeagueValidator.create', () => {
  it('accepts valid university, name and description', () => {
    expect(() =>
      AcademicLeagueValidator.create(
        req({
          body: {
            university: VALID_OID,
            name: 'Liga de Cardiologia',
            description: 'Desc válida aqui',
          },
        }),
      ),
    ).not.toThrow();
  });

  it('throws when university is missing', () => {
    expect(() =>
      AcademicLeagueValidator.create(
        req({ body: { name: 'Liga', description: 'Desc' } }),
      ),
    ).toThrow();
  });

  it('throws when name is too short', () => {
    expect(() =>
      AcademicLeagueValidator.create(
        req({
          body: { university: VALID_OID, name: 'AB', description: 'Desc' },
        }),
      ),
    ).toThrow();
  });

  it('throws when description is missing', () => {
    expect(() =>
      AcademicLeagueValidator.create(
        req({ body: { university: VALID_OID, name: 'Liga Válida' } }),
      ),
    ).toThrow();
  });
});

describe('AcademicLeagueValidator.update', () => {
  it('accepts empty body with valid _id', () => {
    expect(() =>
      AcademicLeagueValidator.update(
        req({ body: {}, params: { _id: VALID_OID } }),
      ),
    ).not.toThrow();
  });

  it('throws when _id is invalid', () => {
    expect(() =>
      AcademicLeagueValidator.update(req({ body: {}, params: { _id: 'bad' } })),
    ).toThrow();
  });
});

describe('AcademicLeagueValidator.destroy', () => {
  it('accepts valid _id', () => {
    expect(() =>
      AcademicLeagueValidator.destroy(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });
});
