import { Router } from 'express';

import * as AcademicLeagueController from '../controllers/AcademicLeagueController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import { verifyPermission } from '../middleware/verifyPermission.js';

const AcademicLeagueRoutes = Router();

AcademicLeagueRoutes.route('/')
  .get(
    verifyJWT,
    verifyPermission('academicLeague.view'),
    AcademicLeagueController.get,
  )
  .post(
    verifyJWT,
    verifyPermission('academicLeague.create'),
    AcademicLeagueController.create,
  );

AcademicLeagueRoutes.route('/:_id')
  .get(
    verifyJWT,
    verifyPermission('academicLeague.view'),
    AcademicLeagueController.getById,
  )
  .patch(
    verifyJWT,
    verifyPermission('academicLeague.edit'),
    AcademicLeagueController.update,
  )
  .delete(
    verifyJWT,
    verifyPermission('academicLeague.delete'),
    AcademicLeagueController.destroy,
  );

export default AcademicLeagueRoutes;
