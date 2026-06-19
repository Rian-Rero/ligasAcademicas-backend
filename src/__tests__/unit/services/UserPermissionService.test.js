import { describe, expect, it } from 'vitest';

import { NotFoundError } from '../../../errors/baseErrors.js';
import UserPermissionModel from '../../../models/UserPermissionModel.js';
import * as UserPermissionService from '../../../services/UserPermissionService.js';
import {
  createAdminUser,
  createPermission,
  createRole,
  createUser,
} from '../../helpers/factories.js';

describe('UserPermissionService.getUserRoleKeys', () => {
  it('throws NotFoundError for a non-existent user', async () => {
    await expect(
      UserPermissionService.getUserRoleKeys('507f1f77bcf86cd799439011'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns empty array when user has no permissions record', async () => {
    const user = await createUser();
    const keys = await UserPermissionService.getUserRoleKeys(
      user._id.toString(),
    );
    expect(keys).toEqual([]);
  });

  it('returns role keys when user has roles assigned', async () => {
    const user = await createUser();
    const role = await createRole({ key: 'testrole' });
    await UserPermissionModel.create({
      user: user._id,
      roles: [role._id],
      permissions: [],
      academicLeague: null,
    });
    const keys = await UserPermissionService.getUserRoleKeys(
      user._id.toString(),
    );
    expect(keys).toContain('testrole');
  });
});

describe('UserPermissionService.userHasRole', () => {
  it('returns false when user does not have the role', async () => {
    const user = await createUser();
    const result = await UserPermissionService.userHasRole(
      user._id.toString(),
      'admin',
    );
    expect(result).toBe(false);
  });

  it('returns true when user has the role', async () => {
    const user = await createAdminUser();
    const result = await UserPermissionService.userHasRole(
      user._id.toString(),
      'admin',
    );
    expect(result).toBe(true);
  });
});

describe('UserPermissionService.addRoleToUser', () => {
  it('throws NotFoundError for non-existent user', async () => {
    const role = await createRole();
    await expect(
      UserPermissionService.addRoleToUser(
        '507f1f77bcf86cd799439011',
        role._id.toString(),
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws NotFoundError for non-existent role', async () => {
    const user = await createUser();
    await expect(
      UserPermissionService.addRoleToUser(
        user._id.toString(),
        '507f1f77bcf86cd799439011',
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('creates a UserPermission document with the role', async () => {
    const user = await createUser();
    const role = await createRole({ key: 'newrole' });
    await UserPermissionService.addRoleToUser(
      user._id.toString(),
      role._id.toString(),
    );
    const keys = await UserPermissionService.getUserRoleKeys(
      user._id.toString(),
    );
    expect(keys).toContain('newrole');
  });

  it('does not duplicate role if already assigned', async () => {
    const user = await createUser();
    const role = await createRole({ key: 'nondupkey' });
    await UserPermissionService.addRoleToUser(
      user._id.toString(),
      role._id.toString(),
    );
    await UserPermissionService.addRoleToUser(
      user._id.toString(),
      role._id.toString(),
    );
    const perm = await UserPermissionModel.findOne({ user: user._id });
    expect(perm.roles.length).toBe(1);
  });
});

describe('UserPermissionService.removeRoleFromUser', () => {
  it('removes the role from user permissions', async () => {
    const user = await createUser();
    const role = await createRole({ key: 'removerole' });
    await UserPermissionService.addRoleToUser(
      user._id.toString(),
      role._id.toString(),
    );
    await UserPermissionService.removeRoleFromUser(
      user._id.toString(),
      role._id.toString(),
    );
    const keys = await UserPermissionService.getUserRoleKeys(
      user._id.toString(),
    );
    expect(keys).not.toContain('removerole');
  });
});

describe('UserPermissionService.addPermissionToUser', () => {
  it('adds a direct permission to a user', async () => {
    const user = await createUser();
    const permission = await createPermission({
      key: 'event.view',
      name: 'View Events',
      module: 'event',
    });
    await UserPermissionService.addPermissionToUser(
      user._id.toString(),
      permission._id.toString(),
    );
    const hasIt = await UserPermissionService.userHasPermission(
      user._id.toString(),
      'event.view',
    );
    expect(hasIt).toBe(true);
  });
});

describe('UserPermissionService.removePermissionFromUser', () => {
  it('removes a direct permission from a user', async () => {
    const user = await createUser();
    const permission = await createPermission({
      key: 'event.delete',
      name: 'Delete Events',
      module: 'event',
    });
    await UserPermissionService.addPermissionToUser(
      user._id.toString(),
      permission._id.toString(),
    );
    await UserPermissionService.removePermissionFromUser(
      user._id.toString(),
      permission._id.toString(),
    );
    const hasIt = await UserPermissionService.userHasPermission(
      user._id.toString(),
      'event.delete',
    );
    expect(hasIt).toBe(false);
  });
});
