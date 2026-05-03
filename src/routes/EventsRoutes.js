import { Router } from 'express';

import * as EventController from '../controllers/EventController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import { verifyPermission } from '../middleware/verifyPermission.js';
import { permissions } from '../utils/general/constants.js';

const EventRoutes = Router();

EventRoutes.route('/')
  .get(verifyJWT, verifyPermission(permissions.event.view), EventController.get)
  .post(
    verifyJWT,
    verifyPermission(permissions.event.create),
    EventController.create,
  );

EventRoutes.get(
  '/:_id/engagement',
  verifyJWT,
  verifyPermission(permissions.event.view),
  EventController.getEngagementById,
);

EventRoutes.route('/:_id')
  .get(
    verifyJWT,
    verifyPermission(permissions.event.view),
    EventController.getById,
  )
  .patch(
    verifyJWT,
    verifyPermission(permissions.event.edit),
    EventController.update,
  )
  .delete(
    verifyJWT,
    verifyPermission(permissions.event.delete),
    EventController.destroy,
  );

export default EventRoutes;
