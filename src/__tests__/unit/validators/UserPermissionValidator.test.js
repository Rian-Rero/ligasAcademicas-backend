import { describe, expect, it } from 'vitest';

import * as UserPermissionValidator from '../../../validators/UserPermissionValidator.js';

const VALID_OID = '507f1f77bcf86cd799439011';

function req(overrides = {}) {
  return { body: {}, params: {}, query: {}, signedCookies: {}, ...overrides };
}

describe('UserPermissionValidator.getUserPermissions', () => {
  it('accepts valid userId', () => {
    expect(() =>
      UserPermissionValidator.getUserPermissions(
        req({ params: { userId: VALID_OID } }),
      ),
    ).not.toThrow();
  });

  it('throws when userId is invalid', () => {
    expect(() =>
      UserPermissionValidator.getUserPermissions(
        req({ params: { userId: 'bad' } }),
      ),
    ).toThrow();
  });
});

describe('UserPermissionValidator.addRoleToUser', () => {
  it('accepts valid userId and roleId', () => {
    expect(() =>
      UserPermissionValidator.addRoleToUser(
        req({
          params: { userId: VALID_OID },
          body: { roleId: VALID_OID },
        }),
      ),
    ).not.toThrow();
  });

  it('throws when roleId is missing', () => {
    expect(() =>
      UserPermissionValidator.addRoleToUser(
        req({
          params: { userId: VALID_OID },
          body: {},
        }),
      ),
    ).toThrow();
  });
});

describe('UserPermissionValidator.removeRoleFromUser', () => {
  it('accepts valid userId and roleId', () => {
    expect(() =>
      UserPermissionValidator.removeRoleFromUser(
        req({
          params: { userId: VALID_OID },
          body: { roleId: VALID_OID },
        }),
      ),
    ).not.toThrow();
  });
});

describe('UserPermissionValidator.addPermissionToUser', () => {
  it('accepts valid userId and permissionId', () => {
    expect(() =>
      UserPermissionValidator.addPermissionToUser(
        req({
          params: { userId: VALID_OID },
          body: { permissionId: VALID_OID },
        }),
      ),
    ).not.toThrow();
  });

  it('throws when permissionId is missing', () => {
    expect(() =>
      UserPermissionValidator.addPermissionToUser(
        req({
          params: { userId: VALID_OID },
          body: {},
        }),
      ),
    ).toThrow();
  });
});

describe('UserPermissionValidator.removePermissionFromUser', () => {
  it('accepts valid userId and permissionId', () => {
    expect(() =>
      UserPermissionValidator.removePermissionFromUser(
        req({
          params: { userId: VALID_OID },
          body: { permissionId: VALID_OID },
        }),
      ),
    ).not.toThrow();
  });
});
