import { ForbiddenError } from '../errors/baseErrors.js';
import asyncHandler from '../utils/general/asyncHandler.js';

const verifyOwnUser = asyncHandler(async (req, res, next) => {
  const requestUserId = req.params._id || req.params.user || req.body.user;
  const authUserId = req.user._id;

  if (requestUserId !== authUserId)
    throw new ForbiddenError('Forbidden action. Not same user');

  next();
});

export default verifyOwnUser;
