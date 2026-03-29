import { UnauthorizedError } from '../errors/baseErrors.js';
import asyncHandler from '../utils/general/asyncHandler.js';
import { decodeAccessToken } from '../utils/libs/jwt.js';

const verifyJWT = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) throw new UnauthorizedError('No authorization header');

  const [scheme, token] = authHeader.split(' ');

  if (!/^Bearer$/i.test(scheme))
    throw new UnauthorizedError('Token bad formatted'); // Bearer not found

  if (!token) throw new UnauthorizedError('No token provided'); // Token not found

  const { user } = await decodeAccessToken(token);
  req.user = user;

  next();
});

export default verifyJWT;
