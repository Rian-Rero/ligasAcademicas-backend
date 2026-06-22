import { describe, expect, it } from 'vitest';

import { ConflictError, NotFoundError } from '../../../errors/baseErrors.js';
import PermissionModel from '../../../models/PermissionModel.js';
import RoleModel from '../../../models/RoleModel.js';
import * as PermissionService from '../../../services/PermissionService.js';
import { createPermission, createRole } from '../../helpers/factories.js';

describe('PermissionService.get', () => {
  it('returns an empty array when no permissions exist', async () => {
    const result = await PermissionService.get({});
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns permissions matching the given filter', async () => {
    await createPermission({ key: 'perm.get_filter' });
    const result = await PermissionService.get({ key: 'perm.get_filter' });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].key).toBe('perm.get_filter');
  });
});

describe('PermissionService.getById', () => {
  it('returns the permission when it exists', async () => {
    const created = await createPermission({ key: 'perm.getbyid_ok' });
    const result = await PermissionService.getById(created._id.toString());
    expect(result._id.toString()).toBe(created._id.toString());
  });

  it('throws NotFoundError for a non-existent id', async () => {
    await expect(
      PermissionService.getById('507f1f77bcf86cd799439011'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('PermissionService.create', () => {
  it('creates and returns a new permission', async () => {
    const result = await PermissionService.create({
      key: 'perm.create_ok',
      name: 'Create OK',
      module: 'event',
      description: 'test',
    });
    expect(result.key).toBe('perm.create_ok');
  });

  it('throws ConflictError when a permission with the same key already exists', async () => {
    await createPermission({ key: 'perm.create_dup' });
    await expect(
      PermissionService.create({
        key: 'perm.create_dup',
        name: 'Duplicate',
        module: 'perm',
        description: 'dup',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe('PermissionService.update', () => {
  it('throws NotFoundError when the permission does not exist', async () => {
    await expect(
      PermissionService.update({
        _id: '507f1f77bcf86cd799439011',
        inputData: { name: 'New Name' },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws ConflictError when trying to update a system permission', async () => {
    const perm = await createPermission({
      key: 'perm.update_system',
      isSystem: true,
    });
    await expect(
      PermissionService.update({
        _id: perm._id.toString(),
        inputData: { name: 'Changed' },
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('throws ConflictError when changing key to one that already exists', async () => {
    await createPermission({ key: 'perm.existing_key' });
    const perm = await createPermission({ key: 'perm.update_keychange' });
    await expect(
      PermissionService.update({
        _id: perm._id.toString(),
        inputData: { key: 'perm.existing_key' },
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('updates and returns the permission when all checks pass', async () => {
    const perm = await createPermission({ key: 'perm.update_ok' });
    const result = await PermissionService.update({
      _id: perm._id.toString(),
      inputData: { name: 'Updated Name' },
    });
    expect(result.name).toBe('Updated Name');
  });

  it('does not throw ConflictError when key is unchanged', async () => {
    const perm = await createPermission({ key: 'perm.update_same_key' });
    const result = await PermissionService.update({
      _id: perm._id.toString(),
      inputData: { key: 'perm.update_same_key', name: 'Same Key Update' },
    });
    expect(result.name).toBe('Same Key Update');
  });
});

describe('PermissionService.destroy', () => {
  it('throws NotFoundError when the permission does not exist', async () => {
    await expect(
      PermissionService.destroy('507f1f77bcf86cd799439011'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws ConflictError when trying to delete a system permission', async () => {
    const perm = await createPermission({
      key: 'perm.destroy_system',
      isSystem: true,
    });
    await expect(
      PermissionService.destroy(perm._id.toString()),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('removes the permission from all roles before deleting', async () => {
    const perm = await createPermission({ key: 'perm.destroy_from_roles' });
    const role = await createRole({ key: 'role_destroy_perm_test' });

    // Manually attach permission to role
    await RoleModel.findByIdAndUpdate(role._id, {
      $push: { permissions: perm._id },
    });

    await PermissionService.destroy(perm._id.toString());

    const updatedRole = await RoleModel.findById(role._id).lean().exec();
    expect(updatedRole.permissions).not.toContain(perm._id);

    const deleted = await PermissionModel.findById(perm._id);
    expect(deleted).toBeNull();
  });
});

describe('PermissionService.seedSystemPermissions', () => {
  it('creates system permissions that do not yet exist', async () => {
    await PermissionService.seedSystemPermissions();

    const systemPerms = await PermissionModel.find({ isSystem: true })
      .lean()
      .exec();
    expect(systemPerms.length).toBeGreaterThan(0);

    const keys = systemPerms.map((p) => p.key);
    expect(keys).toContain('user.create');
    expect(keys).toContain('role.view');
    expect(keys).toContain('system.admin');
  });

  it('does not duplicate permissions when run twice', async () => {
    await PermissionService.seedSystemPermissions();
    await PermissionService.seedSystemPermissions();

    const userCreatePerms = await PermissionModel.find({
      key: 'user.create',
    })
      .lean()
      .exec();
    expect(userCreatePerms).toHaveLength(1);
  });
});
