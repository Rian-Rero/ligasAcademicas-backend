import { describe, expect, it } from 'vitest';

import * as PermissionValidator from '../../../validators/PermissionValidator.js';

const VALID_OID = '507f1f77bcf86cd799439011';

function req(overrides = {}) {
  return { body: {}, params: {}, query: {}, signedCookies: {}, ...overrides };
}

const validCreate = {
  key: 'event.view',
  name: 'View Events',
  module: 'event',
};

describe('PermissionValidator.get', () => {
  it('accepts empty query', () => {
    expect(() => PermissionValidator.get(req())).not.toThrow();
  });

  it('accepts optional module filter', () => {
    expect(() =>
      PermissionValidator.get(req({ query: { module: 'event' } })),
    ).not.toThrow();
  });
});

describe('PermissionValidator.getById', () => {
  it('accepts valid ObjectId', () => {
    expect(() =>
      PermissionValidator.getById(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('throws for invalid ObjectId', () => {
    expect(() =>
      PermissionValidator.getById(req({ params: { _id: 'bad' } })),
    ).toThrow();
  });
});

describe('PermissionValidator.create', () => {
  it('accepts valid permission data', () => {
    expect(() =>
      PermissionValidator.create(req({ body: validCreate })),
    ).not.toThrow();
  });

  it('throws when key is missing', () => {
    const { key: _, ...rest } = validCreate;
    expect(() => PermissionValidator.create(req({ body: rest }))).toThrow();
  });

  it('throws when key contains invalid characters', () => {
    expect(() =>
      PermissionValidator.create(
        req({ body: { ...validCreate, key: 'event!view' } }),
      ),
    ).toThrow();
  });

  it('throws when module is missing', () => {
    const { module: _, ...rest } = validCreate;
    expect(() => PermissionValidator.create(req({ body: rest }))).toThrow();
  });

  it('throws when module is not in enum', () => {
    expect(() =>
      PermissionValidator.create(
        req({ body: { ...validCreate, module: 'invalid_module' } }),
      ),
    ).toThrow();
  });
});

describe('PermissionValidator.update', () => {
  it('accepts empty body with valid _id', () => {
    expect(() =>
      PermissionValidator.update(req({ body: {}, params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('accepts partial update', () => {
    expect(() =>
      PermissionValidator.update(
        req({ body: { name: 'Updated Name' }, params: { _id: VALID_OID } }),
      ),
    ).not.toThrow();
  });

  it('throws when _id is invalid', () => {
    expect(() =>
      PermissionValidator.update(req({ body: {}, params: { _id: 'bad' } })),
    ).toThrow();
  });
});

describe('PermissionValidator.destroy', () => {
  it('accepts valid _id', () => {
    expect(() =>
      PermissionValidator.destroy(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });
});
