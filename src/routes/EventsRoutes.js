import { Router } from 'express';

import * as EventController from '../controllers/EventController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import { verifyPermission } from '../middleware/verifyPermission.js';

const EventRoutes = Router();

EventRoutes.route('/')
  .get(verifyJWT, verifyPermission('event.view'), EventController.get)
  .post(verifyJWT, verifyPermission('event.create'), EventController.create);

EventRoutes.get(
  '/:_id/engagement',
  verifyJWT,
  verifyPermission('event.view'),
  EventController.getEngagementById,
);

EventRoutes.route('/:_id')
  .get(verifyJWT, verifyPermission('event.view'), EventController.getById)
  .patch(verifyJWT, verifyPermission('event.edit'), EventController.update)
  .delete(verifyJWT, verifyPermission('event.delete'), EventController.destroy);

export default EventRoutes;
