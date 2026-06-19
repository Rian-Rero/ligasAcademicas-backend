import { describe, expect, it } from 'vitest';

import * as UniversityValidator from '../../../validators/UniversityValidator.js';

const VALID_OID = '507f1f77bcf86cd799439011';

function req(overrides = {}) {
  return { body: {}, params: {}, query: {}, signedCookies: {}, ...overrides };
}

const validCreate = {
  name: 'UFMG',
  street: 'Av. Antônio Carlos',
  number: 6627,
};

describe('UniversityValidator.get', () => {
  it('accepts empty query', () => {
    expect(() => UniversityValidator.get(req())).not.toThrow();
  });

  it('accepts optional name filter', () => {
    expect(() =>
      UniversityValidator.get(req({ query: { name: 'UFMG' } })),
    ).not.toThrow();
  });
});

describe('UniversityValidator.getById', () => {
  it('accepts valid ObjectId', () => {
    expect(() =>
      UniversityValidator.getById(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('throws for invalid ObjectId', () => {
    expect(() =>
      UniversityValidator.getById(req({ params: { _id: 'bad' } })),
    ).toThrow();
  });
});

describe('UniversityValidator.create', () => {
  it('accepts valid university data', () => {
    expect(() =>
      UniversityValidator.create(req({ body: validCreate })),
    ).not.toThrow();
  });

  it('throws when name is missing', () => {
    const { name: _, ...rest } = validCreate;
    expect(() => UniversityValidator.create(req({ body: rest }))).toThrow();
  });

  it('throws when name is too short', () => {
    expect(() =>
      UniversityValidator.create(req({ body: { ...validCreate, name: 'AB' } })),
    ).toThrow();
  });

  it('throws when street is missing', () => {
    const { street: _, ...rest } = validCreate;
    expect(() => UniversityValidator.create(req({ body: rest }))).toThrow();
  });

  it('throws when number is missing', () => {
    const { number: _, ...rest } = validCreate;
    expect(() => UniversityValidator.create(req({ body: rest }))).toThrow();
  });

  it('throws when number is not positive', () => {
    expect(() =>
      UniversityValidator.create(req({ body: { ...validCreate, number: -1 } })),
    ).toThrow();
  });
});

describe('UniversityValidator.update', () => {
  it('accepts empty body with valid _id', () => {
    expect(() =>
      UniversityValidator.update(req({ body: {}, params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('throws when _id is invalid', () => {
    expect(() =>
      UniversityValidator.update(req({ body: {}, params: { _id: 'bad' } })),
    ).toThrow();
  });
});

describe('UniversityValidator.destroy', () => {
  it('accepts valid _id', () => {
    expect(() =>
      UniversityValidator.destroy(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });
});
