import { describe, expect, it } from 'vitest';

import * as RoleValidator from '../../../validators/RoleValidator.js';

const VALID_OID = '507f1f77bcf86cd799439011';

function req(overrides = {}) {
  return { body: {}, params: {}, query: {}, signedCookies: {}, ...overrides };
}

const validCreate = {
  name: 'League Manager',
  key: 'league_manager',
};

describe('RoleValidator.get', () => {
  it('accepts empty query', () => {
    expect(() => RoleValidator.get(req())).not.toThrow();
  });
});

describe('RoleValidator.getById', () => {
  it('accepts valid ObjectId', () => {
    expect(() =>
      RoleValidator.getById(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('throws for invalid ObjectId', () => {
    expect(() =>
      RoleValidator.getById(req({ params: { _id: 'bad' } })),
    ).toThrow();
  });
});

describe('RoleValidator.create', () => {
  it('accepts valid role data', () => {
    expect(() =>
      RoleValidator.create(req({ body: validCreate })),
    ).not.toThrow();
  });

  it('throws when name is missing', () => {
    const { name: _, ...rest } = validCreate;
    expect(() => RoleValidator.create(req({ body: rest }))).toThrow();
  });

  it('throws when key is missing', () => {
    const { key: _, ...rest } = validCreate;
    expect(() => RoleValidator.create(req({ body: rest }))).toThrow();
  });

  it('throws when key contains invalid characters', () => {
    expect(() =>
      RoleValidator.create(
        req({ body: { ...validCreate, key: 'league.manager' } }),
      ),
    ).toThrow();
  });
});

describe('RoleValidator.update', () => {
  it('accepts empty body with valid _id', () => {
    expect(() =>
      RoleValidator.update(req({ body: {}, params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('throws when _id is invalid', () => {
    expect(() =>
      RoleValidator.update(req({ body: {}, params: { _id: 'bad' } })),
    ).toThrow();
  });
});

describe('RoleValidator.addPermissionToRole', () => {
  it('accepts valid role _id and permissionId', () => {
    expect(() =>
      RoleValidator.addPermissionToRole(
        req({ params: { _id: VALID_OID }, body: { permissionId: VALID_OID } }),
      ),
    ).not.toThrow();
  });

  it('throws when permissionId is missing', () => {
    expect(() =>
      RoleValidator.addPermissionToRole(
        req({ params: { _id: VALID_OID }, body: {} }),
      ),
    ).toThrow();
  });
});

describe('RoleValidator.removePermissionFromRole', () => {
  it('accepts valid role _id and permissionId', () => {
    expect(() =>
      RoleValidator.removePermissionFromRole(
        req({ params: { _id: VALID_OID }, body: { permissionId: VALID_OID } }),
      ),
    ).not.toThrow();
  });
});

describe('RoleValidator.destroy', () => {
  it('accepts valid _id', () => {
    expect(() =>
      RoleValidator.destroy(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });
});
