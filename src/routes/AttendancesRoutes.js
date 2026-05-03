import { Router } from 'express';

import * as AttendanceController from '../controllers/AttendanceController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import { verifyPermission } from '../middleware/verifyPermission.js';
import { permissions } from '../utils/general/constants.js';

const AttendanceRoutes = Router();

AttendanceRoutes.route('/')
  .get(
    verifyJWT,
    verifyPermission(permissions.attendance.view),
    AttendanceController.get,
  )
  .post(
    verifyJWT,
    verifyPermission(permissions.attendance.create),
    AttendanceController.create,
  );

AttendanceRoutes.patch(
  '/:_id/confirm',
  verifyJWT,
  verifyPermission(permissions.attendance.edit),
  AttendanceController.confirm,
);
AttendanceRoutes.patch(
  '/:_id/mark-attended',
  verifyJWT,
  verifyPermission(permissions.attendance.edit),
  AttendanceController.markAttendance,
);

AttendanceRoutes.route('/:_id')
  .get(
    verifyJWT,
    verifyPermission(permissions.attendance.view),
    AttendanceController.getById,
  )
  .patch(
    verifyJWT,
    verifyPermission(permissions.attendance.edit),
    AttendanceController.update,
  )
  .delete(
    verifyJWT,
    verifyPermission(permissions.attendance.delete),
    AttendanceController.destroy,
  );

export default AttendanceRoutes;
