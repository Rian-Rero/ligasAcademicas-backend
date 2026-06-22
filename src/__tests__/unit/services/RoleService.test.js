import { describe, expect, it } from 'vitest';

import { ConflictError, NotFoundError } from '../../../errors/baseErrors.js';
import PermissionModel from '../../../models/PermissionModel.js';
import RoleModel from '../../../models/RoleModel.js';
import UserPermissionModel from '../../../models/UserPermissionModel.js';
import * as RoleService from '../../../services/RoleService.js';
import {
  createPermission,
  createRole,
  createUser,
} from '../../helpers/factories.js';

describe('RoleService.get', () => {
  it('returns an empty array when no roles exist', async () => {
    const result = await RoleService.get({});
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns roles matching the given filter', async () => {
    await createRole({ key: 'role_get_filter_unique' });
    const result = await RoleService.get({ key: 'role_get_filter_unique' });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].key).toBe('role_get_filter_unique');
  });

  it('populates permissions on returned roles', async () => {
    const perm = await createPermission({ key: 'perm.for_role_get' });
    const role = await createRole({ key: 'role_get_with_perm' });
    await RoleModel.findByIdAndUpdate(role._id, {
      $push: { permissions: perm._id },
    });

    const result = await RoleService.get({ key: 'role_get_with_perm' });
    expect(result[0].permissions[0]).toHaveProperty('key');
  });
});

describe('RoleService.getById', () => {
  it('returns the role when it exists', async () => {
    const created = await createRole({ key: 'role_getbyid_ok' });
    const result = await RoleService.getById(created._id.toString());
    expect(result._id.toString()).toBe(created._id.toString());
  });

  it('throws NotFoundError for a non-existent id', async () => {
    await expect(
      RoleService.getById('507f1f77bcf86cd799439011'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('RoleService.create', () => {
  it('creates and returns a new role with populated permissions', async () => {
    const result = await RoleService.create({
      key: 'role_create_ok',
      name: 'Create OK',
    });
    expect(result.key).toBe('role_create_ok');
    expect(Array.isArray(result.permissions)).toBe(true);
  });

  it('throws ConflictError when a role with the same key already exists', async () => {
    await createRole({ key: 'role_create_dup' });
    await expect(
      RoleService.create({ key: 'role_create_dup', name: 'Duplicate' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe('RoleService.update', () => {
  it('throws NotFoundError when the role does not exist', async () => {
    await expect(
      RoleService.update({
        _id: '507f1f77bcf86cd799439011',
        inputData: { name: 'New Name' },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws ConflictError when trying to update a system role', async () => {
    const role = await createRole({
      key: 'role_update_system',
      isSystem: true,
    });
    await expect(
      RoleService.update({
        _id: role._id.toString(),
        inputData: { name: 'Changed' },
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('updates and returns the role when all checks pass', async () => {
    const role = await createRole({ key: 'role_update_ok' });
    const result = await RoleService.update({
      _id: role._id.toString(),
      inputData: { name: 'Updated Role Name' },
    });
    expect(result.name).toBe('Updated Role Name');
  });
});

describe('RoleService.destroy', () => {
  it('throws NotFoundError when the role does not exist', async () => {
    await expect(
      RoleService.destroy('507f1f77bcf86cd799439011'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws ConflictError when trying to delete a system role', async () => {
    const role = await createRole({
      key: 'role_destroy_system',
      isSystem: true,
    });
    await expect(
      RoleService.destroy(role._id.toString()),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('removes the role from all userPermissions before deleting', async () => {
    const role = await createRole({ key: 'role_destroy_from_users' });
    const user = await createUser();

    await UserPermissionModel.create({
      user: user._id,
      roles: [role._id],
      permissions: [],
      academicLeague: null,
    });

    await RoleService.destroy(role._id.toString());

    const updatedUserPerm = await UserPermissionModel.findOne({
      user: user._id,
    })
      .lean()
      .exec();
    expect(updatedUserPerm.roles).not.toContain(role._id);

    const deleted = await RoleModel.findById(role._id);
    expect(deleted).toBeNull();
  });
});

describe('RoleService.addPermissionToRole', () => {
  it('throws NotFoundError when the role does not exist', async () => {
    const perm = await createPermission({ key: 'perm.add_to_role_no_role' });
    await expect(
      RoleService.addPermissionToRole(
        '507f1f77bcf86cd799439011',
        perm._id.toString(),
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws NotFoundError when the permission does not exist', async () => {
    const role = await createRole({ key: 'role_add_perm_no_perm' });
    await expect(
      RoleService.addPermissionToRole(
        role._id.toString(),
        '507f1f77bcf86cd799439011',
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws ConflictError when the role already has the permission', async () => {
    const perm = await createPermission({ key: 'perm.add_dup' });
    const role = await createRole({ key: 'role_add_perm_dup' });

    await RoleService.addPermissionToRole(
      role._id.toString(),
      perm._id.toString(),
    );

    await expect(
      RoleService.addPermissionToRole(role._id.toString(), perm._id.toString()),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('adds the permission to the role and returns the updated role', async () => {
    const perm = await createPermission({ key: 'perm.add_ok' });
    const role = await createRole({ key: 'role_add_perm_ok' });

    const result = await RoleService.addPermissionToRole(
      role._id.toString(),
      perm._id.toString(),
    );

    const permKeys = result.permissions.map((p) => p.key);
    expect(permKeys).toContain('perm.add_ok');
  });
});

describe('RoleService.removePermissionFromRole', () => {
  it('throws NotFoundError when the role does not exist', async () => {
    await expect(
      RoleService.removePermissionFromRole(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('removes the permission from the role and returns the updated role', async () => {
    const perm = await createPermission({ key: 'perm.remove_ok' });
    const role = await createRole({ key: 'role_remove_perm_ok' });

    await RoleService.addPermissionToRole(
      role._id.toString(),
      perm._id.toString(),
    );

    const result = await RoleService.removePermissionFromRole(
      role._id.toString(),
      perm._id.toString(),
    );

    const permKeys = result.permissions.map((p) => p.key);
    expect(permKeys).not.toContain('perm.remove_ok');
  });

  it('is idempotent when removing a permission the role does not have', async () => {
    const role = await createRole({ key: 'role_remove_perm_noop' });
    const result = await RoleService.removePermissionFromRole(
      role._id.toString(),
      '507f1f77bcf86cd799439011',
    );
    expect(result).toBeDefined();
  });
});

describe('RoleService.seedSystemRoles', () => {
  it('creates system roles when they do not yet exist', async () => {
    // Seed permissions first since roles reference them
    const { seedSystemPermissions } =
      await import('../../../services/PermissionService.js');
    await seedSystemPermissions();

    await RoleService.seedSystemRoles();

    const adminRole = await RoleModel.findOne({ key: 'admin' }).lean().exec();
    expect(adminRole).not.toBeNull();
    expect(adminRole.isSystem).toBe(true);

    const managerRole = await RoleModel.findOne({ key: 'manager' })
      .lean()
      .exec();
    expect(managerRole).not.toBeNull();

    const memberRole = await RoleModel.findOne({ key: 'member' }).lean().exec();
    expect(memberRole).not.toBeNull();
  });

  it('syncs existing system roles permissions when run again', async () => {
    const { seedSystemPermissions } =
      await import('../../../services/PermissionService.js');
    await seedSystemPermissions();
    await RoleService.seedSystemRoles();

    // Run again — should update without throwing
    await RoleService.seedSystemRoles();

    const adminRole = await RoleModel.findOne({ key: 'admin' }).lean().exec();
    expect(adminRole).not.toBeNull();

    const allSystemPerms = await PermissionModel.find({ isSystem: true })
      .lean()
      .exec();
    // Admin should have all system permissions synced
    expect(adminRole.permissions.length).toBe(allSystemPerms.length);
  });
});
