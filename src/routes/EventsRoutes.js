import { Router } from 'express';

import * as EventController from '../controllers/EventController.js';

const EventRoutes = Router();

EventRoutes.route('/').get(EventController.get).post(EventController.create);

EventRoutes.get('/:_id/engagement', EventController.getEngagementById);

EventRoutes.route('/:_id')
  .get(EventController.getById)
  .patch(EventController.update)
  .delete(EventController.destroy);

export default EventRoutes;
