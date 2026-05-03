import { Router } from 'express';

import * as LeagueMembershipController from '../controllers/LeagueMembershipController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import { verifyPermission } from '../middleware/verifyPermission.js';
import { permissions } from '../utils/general/constants.js';

const LeagueMembershipRoutes = Router();

LeagueMembershipRoutes.route('/')
  .get(
    verifyJWT,
    verifyPermission(permissions.leagueMembership.view),
    LeagueMembershipController.get,
  )
  .post(
    verifyJWT,
    verifyPermission(permissions.leagueMembership.create),
    LeagueMembershipController.create,
  );

LeagueMembershipRoutes.get(
  '/inactive',
  verifyJWT,
  verifyPermission(permissions.leagueMembership.view),
  LeagueMembershipController.getInactive,
);

LeagueMembershipRoutes.route('/:_id')
  .get(
    verifyJWT,
    verifyPermission(permissions.leagueMembership.view),
    LeagueMembershipController.getById,
  )
  .patch(
    verifyJWT,
    verifyPermission(permissions.leagueMembership.edit),
    LeagueMembershipController.update,
  )
  .delete(
    verifyJWT,
    verifyPermission(permissions.leagueMembership.delete),
    LeagueMembershipController.destroy,
  );

LeagueMembershipRoutes.route('/:_id/end').patch(
  verifyJWT,
  verifyPermission(permissions.leagueMembership.edit),
  LeagueMembershipController.end,
);

export default LeagueMembershipRoutes;
