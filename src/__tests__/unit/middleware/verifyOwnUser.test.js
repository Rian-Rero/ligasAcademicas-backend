import { describe, expect, it, vi } from 'vitest';

import { ForbiddenError } from '../../../errors/baseErrors.js';
import verifyOwnUser from '../../../middleware/verifyOwnUser.js';

function makeReqRes(authUserId, paramUserId) {
  const req = {
    params: { _id: paramUserId },
    body: {},
    user: { _id: authUserId },
  };
  const res = {};
  const next = vi.fn();
  return { req, res, next };
}

describe('verifyOwnUser middleware', () => {
  it('calls next() when the authenticated user matches the requested user id', async () => {
    const { req, res, next } = makeReqRes('user123', 'user123');
    await verifyOwnUser(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(ForbiddenError) when the authenticated user does not match', async () => {
    const { req, res, next } = makeReqRes('user123', 'user456');
    await verifyOwnUser(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});
