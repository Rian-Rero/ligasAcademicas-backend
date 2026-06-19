import { describe, expect, it, vi } from 'vitest';

import { signSessionJwts } from '../../../utils/libs/jwt.js';
import { UnauthorizedError } from '../../../errors/baseErrors.js';
import verifyJWT from '../../../middleware/verifyJWT.js';

const testUser = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test',
  email: 'test@sgla.com',
  roleKeys: [],
};

function makeReqRes(authHeader) {
  const req = { headers: { authorization: authHeader } };
  const res = {};
  const next = vi.fn();
  return { req, res, next };
}

describe('verifyJWT middleware', () => {
  it('calls next(UnauthorizedError) when no authorization header is present', async () => {
    const { req, res, next } = makeReqRes(undefined);
    await verifyJWT(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('calls next(UnauthorizedError) when scheme is not Bearer', async () => {
    const { req, res, next } = makeReqRes('Basic sometoken');
    await verifyJWT(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('calls next(UnauthorizedError) when Bearer has no token', async () => {
    const { req, res, next } = makeReqRes('Bearer ');
    await verifyJWT(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('sets req.user and calls next() with a valid token', async () => {
    const { accessToken } = signSessionJwts(testUser);
    const { req, res, next } = makeReqRes(`Bearer ${accessToken}`);
    await verifyJWT(req, res, next);
    expect(req.user).toMatchObject({ _id: testUser._id });
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(error) when the token is invalid', async () => {
    const { req, res, next } = makeReqRes('Bearer invalid.token');
    await verifyJWT(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
