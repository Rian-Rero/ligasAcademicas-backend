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

describe('UserPermissionService.getUserPermissions', () => {
  it('throws NotFoundError for a non-existent user', async () => {
    await expect(
      UserPermissionService.getUserPermissions('507f1f77bcf86cd799439011'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns all permissions for admin user', async () => {
    const { createAdminUser: createAdmin } =
      await import('../../helpers/factories.js');
    const admin = await createAdmin();
    const result = await UserPermissionService.getUserPermissions(
      admin._id.toString(),
    );
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns empty array when user has no permission record', async () => {
    const user = await createUser();
    const result = await UserPermissionService.getUserPermissions(
      user._id.toString(),
    );
    expect(result).toEqual([]);
  });

  it('returns combined permissions from roles and direct permissions', async () => {
    const user = await createUser();
    const permission = await createPermission({
      key: 'task.view',
      name: 'View Tasks',
      module: 'task',
    });
    const role = await createRole({ key: 'task_viewer' });
    const rolePermission = await createPermission({
      key: 'task.list',
      name: 'List Tasks',
      module: 'task',
    });
    // Add permission to role manually
    const RoleModel = (await import('../../../models/RoleModel.js')).default;
    await RoleModel.findByIdAndUpdate(role._id, {
      $push: { permissions: rolePermission._id },
    });
    // Create permission record with role and direct permission
    await UserPermissionModel.create({
      user: user._id,
      roles: [role._id],
      permissions: [permission._id],
      academicLeague: null,
    });
    const result = await UserPermissionService.getUserPermissions(
      user._id.toString(),
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});

describe('UserPermissionService.addPermissionToUser — existing record branch', () => {
  it('adds permission to existing UserPermission document (lines 293-299)', async () => {
    const user = await createUser();
    const permA = await createPermission({
      key: 'event.edit',
      name: 'Edit Event',
      module: 'event',
    });
    const permB = await createPermission({
      key: 'event.create',
      name: 'Create Event',
      module: 'event',
    });
    // First call creates the document
    await UserPermissionService.addPermissionToUser(
      user._id.toString(),
      permA._id.toString(),
    );
    // Second call with different permission hits the existing-record branch
    await UserPermissionService.addPermissionToUser(
      user._id.toString(),
      permB._id.toString(),
    );
    const perm = await UserPermissionModel.findOne({ user: user._id });
    expect(perm.permissions.length).toBe(2);
  });

  it('does not duplicate permission if already assigned (lines 293-299 guard)', async () => {
    const user = await createUser();
    const permission = await createPermission({
      key: 'event.approve',
      name: 'Approve Event',
      module: 'event',
    });
    await UserPermissionService.addPermissionToUser(
      user._id.toString(),
      permission._id.toString(),
    );
    await UserPermissionService.addPermissionToUser(
      user._id.toString(),
      permission._id.toString(),
    );
    const perm = await UserPermissionModel.findOne({ user: user._id });
    expect(perm.permissions.length).toBe(1);
  });

  it('throws NotFoundError for non-existent permission', async () => {
    const user = await createUser();
    await expect(
      UserPermissionService.addPermissionToUser(
        user._id.toString(),
        '507f1f77bcf86cd799439011',
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('UserPermissionService.removePermissionFromUser — NotFoundError branch (line 316)', () => {
  it('throws NotFoundError for non-existent user', async () => {
    await expect(
      UserPermissionService.removePermissionFromUser(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns null when user has no permission record', async () => {
    const user = await createUser();
    const permission = await createPermission({
      key: 'event.archive',
      name: 'Archive Event',
      module: 'event',
    });
    const result = await UserPermissionService.removePermissionFromUser(
      user._id.toString(),
      permission._id.toString(),
    );
    expect(result).toBeNull();
  });
});

describe('UserPermissionService.getUserPermissionDetails', () => {
  it('throws NotFoundError for a non-existent user', async () => {
    await expect(
      UserPermissionService.getUserPermissionDetails(
        '507f1f77bcf86cd799439011',
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns null when user has no permission record', async () => {
    const user = await createUser();
    const result = await UserPermissionService.getUserPermissionDetails(
      user._id.toString(),
    );
    expect(result).toBeNull();
  });
});

describe('UserPermissionService.updateUserPermissions', () => {
  it('throws NotFoundError for non-existent user', async () => {
    await expect(
      UserPermissionService.updateUserPermissions('507f1f77bcf86cd799439011', {
        roles: [],
        permissions: [],
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('creates a new permission document when none exists', async () => {
    const user = await createUser();
    const role = await createRole({ key: 'update_role' });
    const result = await UserPermissionService.updateUserPermissions(
      user._id.toString(),
      { roles: [role._id.toString()], permissions: [] },
    );
    expect(result).not.toBeNull();
    expect(result.roles.length).toBeGreaterThanOrEqual(1);
  });

  it('updates existing permission document', async () => {
    const user = await createUser();
    const role = await createRole({ key: 'updatable_role' });
    // Create initial record
    await UserPermissionService.updateUserPermissions(user._id.toString(), {
      roles: [],
      permissions: [],
    });
    // Now update it
    const result = await UserPermissionService.updateUserPermissions(
      user._id.toString(),
      { roles: [role._id.toString()], permissions: [] },
    );
    expect(
      result.roles.some((r) => r._id.toString() === role._id.toString()),
    ).toBe(true);
  });
});

describe('UserPermissionService.removeRoleFromUser — edge cases', () => {
  it('throws NotFoundError for non-existent user', async () => {
    await expect(
      UserPermissionService.removeRoleFromUser(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns null when user has no permission record', async () => {
    const user = await createUser();
    const role = await createRole({ key: 'no_record_role' });
    const result = await UserPermissionService.removeRoleFromUser(
      user._id.toString(),
      role._id.toString(),
    );
    expect(result).toBeNull();
  });
});

describe('UserPermissionService.userHasPermission', () => {
  it('throws NotFoundError for non-existent user', async () => {
    await expect(
      UserPermissionService.userHasPermission(
        '507f1f77bcf86cd799439011',
        'event.view',
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns true for admin user regardless of permission key', async () => {
    const { createAdminUser: createAdmin } =
      await import('../../helpers/factories.js');
    const admin = await createAdmin();
    const result = await UserPermissionService.userHasPermission(
      admin._id.toString(),
      'any.permission',
    );
    expect(result).toBe(true);
  });

  it('returns false when user has no matching permission', async () => {
    const user = await createUser();
    const result = await UserPermissionService.userHasPermission(
      user._id.toString(),
      'nonexistent.permission',
    );
    expect(result).toBe(false);
  });
});
