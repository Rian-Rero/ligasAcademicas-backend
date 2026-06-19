import { describe, expect, it } from 'vitest';

import * as EventValidator from '../../../validators/EventValidator.js';

const VALID_OID = '507f1f77bcf86cd799439011';

function req(overrides = {}) {
  return { body: {}, params: {}, query: {}, signedCookies: {}, ...overrides };
}

const validCreate = {
  academicLeague: VALID_OID,
  title: 'Evento de Cardiologia',
  description: 'Estudo sobre coração',
  dateTime: new Date().toISOString(),
  location: 'Sala 101',
};

describe('EventValidator.get', () => {
  it('accepts empty query', () => {
    expect(() => EventValidator.get(req())).not.toThrow();
  });

  it('accepts optional filters', () => {
    expect(() =>
      EventValidator.get(
        req({ query: { title: 'Evento', academicLeague: VALID_OID } }),
      ),
    ).not.toThrow();
  });
});

describe('EventValidator.getById', () => {
  it('accepts valid ObjectId', () => {
    expect(() =>
      EventValidator.getById(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('throws for invalid ObjectId', () => {
    expect(() =>
      EventValidator.getById(req({ params: { _id: 'bad' } })),
    ).toThrow();
  });
});

describe('EventValidator.create', () => {
  it('accepts valid event data', () => {
    expect(() =>
      EventValidator.create(req({ body: validCreate })),
    ).not.toThrow();
  });

  it('throws when academicLeague is missing', () => {
    const { academicLeague: _, ...rest } = validCreate;
    expect(() => EventValidator.create(req({ body: rest }))).toThrow();
  });

  it('throws when title is missing', () => {
    const { title: _, ...rest } = validCreate;
    expect(() => EventValidator.create(req({ body: rest }))).toThrow();
  });

  it('throws when title is too short', () => {
    expect(() =>
      EventValidator.create(req({ body: { ...validCreate, title: 'AB' } })),
    ).toThrow();
  });

  it('throws when description is missing', () => {
    const { description: _, ...rest } = validCreate;
    expect(() => EventValidator.create(req({ body: rest }))).toThrow();
  });

  it('throws when dateTime is missing', () => {
    const { dateTime: _, ...rest } = validCreate;
    expect(() => EventValidator.create(req({ body: rest }))).toThrow();
  });

  it('throws when location is missing', () => {
    const { location: _, ...rest } = validCreate;
    expect(() => EventValidator.create(req({ body: rest }))).toThrow();
  });
});

describe('EventValidator.update', () => {
  it('accepts empty body with valid _id', () => {
    expect(() =>
      EventValidator.update(req({ body: {}, params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('accepts partial updates', () => {
    expect(() =>
      EventValidator.update(
        req({ body: { title: 'Novo Título' }, params: { _id: VALID_OID } }),
      ),
    ).not.toThrow();
  });

  it('throws when _id is invalid', () => {
    expect(() =>
      EventValidator.update(req({ body: {}, params: { _id: 'bad' } })),
    ).toThrow();
  });
});

describe('EventValidator.destroy', () => {
  it('accepts valid _id', () => {
    expect(() =>
      EventValidator.destroy(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });
});
