import { Router } from 'express';

import * as TaskController from '../controllers/TaskController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import { verifyPermission } from '../middleware/verifyPermission.js';

const TaskRoutes = Router();

TaskRoutes.route('/')
  .get(verifyJWT, verifyPermission('task.view'), TaskController.get)
  .post(verifyJWT, verifyPermission('task.create'), TaskController.create);

TaskRoutes.route('/:_id')
  .get(verifyJWT, verifyPermission('task.view'), TaskController.getById)
  .patch(verifyJWT, verifyPermission('task.edit'), TaskController.update)
  .delete(verifyJWT, verifyPermission('task.delete'), TaskController.destroy);

TaskRoutes.patch(
  '/:_id/complete',
  verifyJWT,
  verifyPermission('task.edit'),
  TaskController.completeTask,
);

export default TaskRoutes;
