import { Router } from 'express';

import * as LeagueMembershipController from '../controllers/LeagueMembershipController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import { verifyPermission } from '../middleware/verifyPermission.js';

const LeagueMembershipRoutes = Router();

LeagueMembershipRoutes.route('/')
  .get(
    verifyJWT,
    verifyPermission('leagueMembership.view'),
    LeagueMembershipController.get,
  )
  .post(
    verifyJWT,
    verifyPermission('leagueMembership.create'),
    LeagueMembershipController.create,
  );

LeagueMembershipRoutes.route('/:_id')
  .get(
    verifyJWT,
    verifyPermission('leagueMembership.view'),
    LeagueMembershipController.getById,
  )
  .patch(
    verifyJWT,
    verifyPermission('leagueMembership.edit'),
    LeagueMembershipController.update,
  )
  .delete(
    verifyJWT,
    verifyPermission('leagueMembership.delete'),
    LeagueMembershipController.destroy,
  );

LeagueMembershipRoutes.route('/:_id/end').patch(
  verifyJWT,
  verifyPermission('leagueMembership.edit'),
  LeagueMembershipController.end,
);

export default LeagueMembershipRoutes;
