import { ForbiddenError } from '../errors/baseErrors.js';
import asyncHandler from '../utils/general/asyncHandler.js';

const verifyAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user.isAdmin) throw new ForbiddenError('Access denied');

  next();
});

export default verifyAdmin;
