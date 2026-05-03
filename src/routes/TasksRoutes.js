import { Router } from 'express';

import * as TaskController from '../controllers/TaskController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import { verifyPermission } from '../middleware/verifyPermission.js';
import { permissions } from '../utils/general/constants.js';

const TaskRoutes = Router();

TaskRoutes.route('/')
  .get(verifyJWT, verifyPermission(permissions.task.view), TaskController.get)
  .post(
    verifyJWT,
    verifyPermission(permissions.task.create),
    TaskController.create,
  );

TaskRoutes.route('/:_id')
  .get(
    verifyJWT,
    verifyPermission(permissions.task.view),
    TaskController.getById,
  )
  .patch(
    verifyJWT,
    verifyPermission(permissions.task.edit),
    TaskController.update,
  )
  .delete(
    verifyJWT,
    verifyPermission(permissions.task.delete),
    TaskController.destroy,
  );

TaskRoutes.patch(
  '/:_id/complete',
  verifyJWT,
  verifyPermission(permissions.task.edit),
  TaskController.completeTask,
);

export default TaskRoutes;
