import { describe, expect, it, vi } from 'vitest';

import { ForbiddenError } from '../../../errors/baseErrors.js';

vi.mock('../../../services/UserPermissionService.js', () => ({
  userHasRole: vi.fn(),
  getUserRoleKeys: vi.fn().mockResolvedValue([]),
  getUserPermissions: vi.fn().mockResolvedValue([]),
  userHasPermission: vi.fn(),
}));

import * as UserPermissionService from '../../../services/UserPermissionService.js';
import {
  verifyPermission,
  verifyPermissionAdmin,
  verifyAnyPermission,
  verifyAllPermissions,
} from '../../../middleware/verifyPermission.js';

function makeReq(userId = 'user-1', extra = {}) {
  return { user: { _id: userId }, params: {}, body: {}, ...extra };
}

describe('verifyPermission', () => {
  it('calls next() when user is admin', async () => {
    UserPermissionService.userHasRole.mockResolvedValueOnce(true);
    const next = vi.fn();
    const mw = verifyPermission('event.create');
    await mw(makeReq(), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() when user has the required permission', async () => {
    UserPermissionService.userHasRole.mockResolvedValueOnce(false);
    UserPermissionService.userHasPermission.mockResolvedValueOnce(true);
    const next = vi.fn();
    const mw = verifyPermission('event.create');
    await mw(makeReq(), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(ForbiddenError) when user lacks the permission', async () => {
    UserPermissionService.userHasRole.mockResolvedValueOnce(false);
    UserPermissionService.userHasPermission.mockResolvedValueOnce(false);
    const next = vi.fn();
    const mw = verifyPermission('event.delete');
    await mw(makeReq(), {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('calls next(ForbiddenError) when user is undefined', async () => {
    const next = vi.fn();
    const mw = verifyPermission('event.delete');
    await mw({ user: null, params: {}, body: {} }, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});

describe('verifyPermissionAdmin', () => {
  it('calls next() when user is admin', async () => {
    UserPermissionService.userHasRole.mockResolvedValueOnce(true);
    const next = vi.fn();
    await verifyPermissionAdmin(makeReq(), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() when user has system.admin permission', async () => {
    UserPermissionService.userHasRole.mockResolvedValueOnce(false);
    UserPermissionService.userHasPermission.mockResolvedValueOnce(true);
    const next = vi.fn();
    await verifyPermissionAdmin(makeReq(), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(ForbiddenError) when user has no permission admin', async () => {
    UserPermissionService.userHasRole.mockResolvedValueOnce(false);
    UserPermissionService.userHasPermission.mockResolvedValueOnce(false);
    const next = vi.fn();
    await verifyPermissionAdmin(makeReq(), {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});

describe('verifyAnyPermission', () => {
  it('calls next() when admin', async () => {
    UserPermissionService.userHasRole.mockResolvedValueOnce(true);
    const next = vi.fn();
    const mw = verifyAnyPermission(['event.create', 'event.view']);
    await mw(makeReq(), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() when user has at least one permission', async () => {
    UserPermissionService.userHasRole.mockResolvedValueOnce(false);
    UserPermissionService.userHasPermission
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    const next = vi.fn();
    const mw = verifyAnyPermission(['event.create', 'event.view']);
    await mw(makeReq(), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(ForbiddenError) when user has none of the permissions', async () => {
    UserPermissionService.userHasRole.mockResolvedValueOnce(false);
    UserPermissionService.userHasPermission.mockResolvedValue(false);
    const next = vi.fn();
    const mw = verifyAnyPermission(['event.create', 'event.view']);
    await mw(makeReq(), {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});

describe('verifyAllPermissions', () => {
  it('calls next() when admin', async () => {
    UserPermissionService.userHasRole.mockResolvedValueOnce(true);
    const next = vi.fn();
    const mw = verifyAllPermissions(['event.create', 'event.view']);
    await mw(makeReq(), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() when user has all permissions', async () => {
    UserPermissionService.userHasRole.mockResolvedValueOnce(false);
    UserPermissionService.userHasPermission.mockResolvedValue(true);
    const next = vi.fn();
    const mw = verifyAllPermissions(['event.create', 'event.view']);
    await mw(makeReq(), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(ForbiddenError) when user lacks one permission', async () => {
    UserPermissionService.userHasRole.mockResolvedValueOnce(false);
    UserPermissionService.userHasPermission
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const next = vi.fn();
    const mw = verifyAllPermissions(['event.create', 'event.view']);
    await mw(makeReq(), {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});
