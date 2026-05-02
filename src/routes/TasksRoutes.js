import { Router } from 'express';

import * as TaskController from '../controllers/TaskController.js';
import verifyJWT from '../middleware/verifyJWT.js';

const TaskRoutes = Router();

TaskRoutes.route('/')
  .get(verifyJWT, TaskController.get)
  .post(verifyJWT, TaskController.create);

TaskRoutes.route('/:_id')
  .get(verifyJWT, TaskController.getById)
  .patch(verifyJWT, TaskController.update)
  .delete(verifyJWT, TaskController.destroy);

TaskRoutes.patch('/:_id/complete', verifyJWT, TaskController.completeTask);

export default TaskRoutes;
