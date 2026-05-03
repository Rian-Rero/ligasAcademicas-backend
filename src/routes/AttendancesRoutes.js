import { Router } from 'express';

import * as AttendanceController from '../controllers/AttendanceController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import { verifyPermission } from '../middleware/verifyPermission.js';

const AttendanceRoutes = Router();

AttendanceRoutes.route('/')
  .get(verifyJWT, verifyPermission('attendance.view'), AttendanceController.get)
  .post(
    verifyJWT,
    verifyPermission('attendance.create'),
    AttendanceController.create,
  );

AttendanceRoutes.patch(
  '/:_id/confirm',
  verifyJWT,
  verifyPermission('attendance.edit'),
  AttendanceController.confirm,
);
AttendanceRoutes.patch(
  '/:_id/mark-attended',
  verifyJWT,
  verifyPermission('attendance.edit'),
  AttendanceController.markAttendance,
);

AttendanceRoutes.route('/:_id')
  .get(
    verifyJWT,
    verifyPermission('attendance.view'),
    AttendanceController.getById,
  )
  .patch(
    verifyJWT,
    verifyPermission('attendance.edit'),
    AttendanceController.update,
  )
  .delete(
    verifyJWT,
    verifyPermission('attendance.delete'),
    AttendanceController.destroy,
  );

export default AttendanceRoutes;
