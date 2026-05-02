import { Router } from 'express';

import * as LeagueMembershipController from '../controllers/LeagueMembershipController.js';

const LeagueMembershipRoutes = Router();

LeagueMembershipRoutes.route('/')
  .get(LeagueMembershipController.get)
  .post(LeagueMembershipController.create);

LeagueMembershipRoutes.route('/:_id')
  .get(LeagueMembershipController.getById)
  .patch(LeagueMembershipController.update)
  .delete(LeagueMembershipController.destroy);

LeagueMembershipRoutes.route('/:_id/end').patch(LeagueMembershipController.end);

export default LeagueMembershipRoutes;
