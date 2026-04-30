import { Router } from 'express';

import * as EventController from '../controllers/EventController.js';
import verifyJWT from '../middleware/verifyJWT.js';

const EventRoutes = Router();

EventRoutes.route('/')
  .get(EventController.get)
  .post(verifyJWT, EventController.create);

EventRoutes.get('/:_id/engagement', EventController.getEngagementById);

EventRoutes.route('/:_id')
  .get(EventController.getById)
  .patch(verifyJWT, EventController.update)
  .delete(verifyJWT, EventController.destroy);

export default EventRoutes;
