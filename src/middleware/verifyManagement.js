import { ForbiddenError } from '../errors/baseErrors.js';
import LeagueMembershipModel from '../models/LeagueMembershipModel.js';
import asyncHandler from '../utils/general/asyncHandler.js';

const MANAGEMENT_ROLE_VALUES = ['admin', 'president'];
const MANAGEMENT_ROLE_PATTERNS = MANAGEMENT_ROLE_VALUES.map(
  (role) => new RegExp(`^${role}$`, 'i'),
);

const verifyManagement = asyncHandler(async (req, res, next) => {
  const authUser = req.user;

  if (authUser?.globalRole === 'admin') {
    next();
    return;
  }

  const academicLeagueId =
    req.params?.academicLeague ||
    req.params?.academicLeagueId ||
    req.body?.academicLeague ||
    req.body?.academicLeagueId;

  if (!academicLeagueId) {
    throw new ForbiddenError('Access denied');
  }

  const activeManagementMembership = await LeagueMembershipModel.findOne({
    user: authUser?._id,
    academicLeague: academicLeagueId,
    isActive: true,
    role: { $in: MANAGEMENT_ROLE_PATTERNS },
  })
    .lean()
    .exec();

  if (!activeManagementMembership) {
    throw new ForbiddenError('Access denied');
  }

  next();
});

export default verifyManagement;
