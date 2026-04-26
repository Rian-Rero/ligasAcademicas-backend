import { Router } from 'express';

import * as AttendanceController from '../controllers/AttendanceController.js';

const AttendanceRoutes = Router();

AttendanceRoutes.route('/')
  .get(AttendanceController.get)
  .post(AttendanceController.create);

AttendanceRoutes.patch('/:_id/confirm', AttendanceController.confirm);
AttendanceRoutes.patch(
  '/:_id/mark-attended',
  AttendanceController.markAttendance,
);

AttendanceRoutes.route('/:_id')
  .get(AttendanceController.getById)
  .patch(AttendanceController.update)
  .delete(AttendanceController.destroy);

export default AttendanceRoutes;
