import { describe, expect, it, vi } from 'vitest';

import { ForbiddenError } from '../../../errors/baseErrors.js';

vi.mock('../../../services/UserPermissionService.js', () => ({
  userHasRole: vi.fn(),
  getUserRoleKeys: vi.fn().mockResolvedValue([]),
  getUserPermissions: vi.fn().mockResolvedValue([]),
  userHasPermission: vi.fn().mockResolvedValue(false),
}));

vi.mock('../../../models/LeagueMembershipModel.js', () => ({
  default: { findOne: vi.fn() },
}));

import * as UserPermissionService from '../../../services/UserPermissionService.js';
import LeagueMembershipModel from '../../../models/LeagueMembershipModel.js';
import verifyManagement from '../../../middleware/verifyManagement.js';

function makeReq(userId = 'user-1', extra = {}) {
  return { user: { _id: userId }, params: {}, body: {}, ...extra };
}

const leanExec = (value) => ({
  lean: () => ({ exec: () => Promise.resolve(value) }),
});

describe('verifyManagement middleware', () => {
  it('calls next() when user is admin', async () => {
    UserPermissionService.userHasRole.mockResolvedValueOnce(true); // admin check
    const next = vi.fn();
    await verifyManagement(makeReq(), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() when user has global manager role', async () => {
    UserPermissionService.userHasRole
      .mockResolvedValueOnce(false) // admin check
      .mockResolvedValueOnce(true); // manager check
    const next = vi.fn();
    await verifyManagement(makeReq(), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() when user has league manager membership', async () => {
    UserPermissionService.userHasRole.mockResolvedValue(false);
    LeagueMembershipModel.findOne.mockReturnValueOnce(
      leanExec({ _id: 'membership-1', role: 'manager' }),
    );
    const next = vi.fn();
    const req = makeReq('user-1', { params: { academicLeague: 'league-1' } });
    await verifyManagement(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(ForbiddenError) when no league id and no global role', async () => {
    UserPermissionService.userHasRole.mockResolvedValue(false);
    const next = vi.fn();
    await verifyManagement(makeReq(), {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('calls next(ForbiddenError) when user is not a manager of the league', async () => {
    UserPermissionService.userHasRole.mockResolvedValue(false);
    LeagueMembershipModel.findOne.mockReturnValueOnce(leanExec(null));
    const next = vi.fn();
    const req = makeReq('user-1', { params: { academicLeague: 'league-2' } });
    await verifyManagement(req, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});
