import { ForbiddenError } from '../errors/baseErrors.js';
import asyncHandler from '../utils/general/asyncHandler.js';

const verifyAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.globalRole !== 'admin')
    throw new ForbiddenError('Access denied');

  next();
});

export default verifyAdmin;
