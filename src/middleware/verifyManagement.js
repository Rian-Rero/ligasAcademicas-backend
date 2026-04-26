import { ForbiddenError } from '../errors/baseErrors.js';
import LeagueMembershipModel from '../models/LeagueMembershipModel.js';
import asyncHandler from '../utils/general/asyncHandler.js';

const MANAGEMENT_ROLE_REGEX = /(admin|manager|gest|diret|presid|coorden)/i;

const verifyManagement = asyncHandler(async (req, res, next) => {
  const authUser = req.user;

  if (MANAGEMENT_ROLE_REGEX.test(String(authUser?.globalRole || ''))) {
    next();
    return;
  }

  const activeManagementMembership = await LeagueMembershipModel.findOne({
    user: authUser?._id,
    isActive: true,
    role: { $regex: MANAGEMENT_ROLE_REGEX },
  })
    .lean()
    .exec();

  if (!activeManagementMembership) {
    throw new ForbiddenError('Access denied');
  }

  next();
});

export default verifyManagement;
