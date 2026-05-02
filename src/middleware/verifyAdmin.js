import { ForbiddenError } from '../errors/baseErrors.js';
import asyncHandler from '../utils/general/asyncHandler.js';
import * as UserPermissionService from '../services/UserPermissionService.js';

const verifyAdmin = asyncHandler(async (req, res, next) => {
  const isAdmin = await UserPermissionService.userHasRole(
    req.user._id,
    'admin',
  );

  if (!isAdmin) throw new ForbiddenError('Access denied');

  next();
});

export default verifyAdmin;
