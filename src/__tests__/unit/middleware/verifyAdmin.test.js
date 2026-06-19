import { describe, expect, it, vi } from 'vitest';

import { ForbiddenError } from '../../../errors/baseErrors.js';

vi.mock('../../../services/UserPermissionService.js', () => ({
  userHasRole: vi.fn(),
  getUserRoleKeys: vi.fn().mockResolvedValue([]),
  getUserPermissions: vi.fn().mockResolvedValue([]),
  userHasPermission: vi.fn().mockResolvedValue(false),
}));

import * as UserPermissionService from '../../../services/UserPermissionService.js';
import verifyAdmin from '../../../middleware/verifyAdmin.js';

function makeReqRes(userId) {
  const req = { user: { _id: userId } };
  const res = {};
  const next = vi.fn();
  return { req, res, next };
}

describe('verifyAdmin middleware', () => {
  it('calls next() when the user has the admin role', async () => {
    UserPermissionService.userHasRole.mockResolvedValueOnce(true);
    const { req, res, next } = makeReqRes('user-123');
    await verifyAdmin(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(ForbiddenError) when the user does not have admin role', async () => {
    UserPermissionService.userHasRole.mockResolvedValueOnce(false);
    const { req, res, next } = makeReqRes('user-456');
    await verifyAdmin(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});
