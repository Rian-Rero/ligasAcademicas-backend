import { describe, expect, it } from 'vitest';

import * as SquadValidator from '../../../validators/SquadValidator.js';

const VALID_OID = '507f1f77bcf86cd799439011';

function req(overrides = {}) {
  return { body: {}, params: {}, query: {}, signedCookies: {}, ...overrides };
}

const validCreate = {
  academicLeague: VALID_OID,
  name: 'Diretoria Científica',
  description: 'Responsável pela produção científica',
};

describe('SquadValidator.get', () => {
  it('accepts empty query', () => {
    expect(() => SquadValidator.get(req())).not.toThrow();
  });

  it('accepts optional filters', () => {
    expect(() =>
      SquadValidator.get(
        req({ query: { name: 'Diretoria', academicLeague: VALID_OID } }),
      ),
    ).not.toThrow();
  });
});

describe('SquadValidator.getById', () => {
  it('accepts valid ObjectId', () => {
    expect(() =>
      SquadValidator.getById(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('throws for invalid ObjectId', () => {
    expect(() =>
      SquadValidator.getById(req({ params: { _id: 'bad' } })),
    ).toThrow();
  });
});

describe('SquadValidator.create', () => {
  it('accepts valid squad data', () => {
    expect(() =>
      SquadValidator.create(req({ body: validCreate })),
    ).not.toThrow();
  });

  it('throws when academicLeague is missing', () => {
    const { academicLeague: _, ...rest } = validCreate;
    expect(() => SquadValidator.create(req({ body: rest }))).toThrow();
  });

  it('throws when name is too short', () => {
    expect(() =>
      SquadValidator.create(req({ body: { ...validCreate, name: 'AB' } })),
    ).toThrow();
  });

  it('throws when description is missing', () => {
    const { description: _, ...rest } = validCreate;
    expect(() => SquadValidator.create(req({ body: rest }))).toThrow();
  });
});

describe('SquadValidator.update', () => {
  it('accepts empty body with valid _id', () => {
    expect(() =>
      SquadValidator.update(req({ body: {}, params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('throws when _id is invalid', () => {
    expect(() =>
      SquadValidator.update(req({ body: {}, params: { _id: 'bad' } })),
    ).toThrow();
  });
});

describe('SquadValidator.destroy', () => {
  it('accepts valid _id', () => {
    expect(() =>
      SquadValidator.destroy(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });
});
