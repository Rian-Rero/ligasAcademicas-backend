import { Router } from 'express';

import * as AcademicLeagueController from '../controllers/AcademicLeagueController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import { verifyPermission } from '../middleware/verifyPermission.js';
import { permissions } from '../utils/general/constants.js';

const AcademicLeagueRoutes = Router();

AcademicLeagueRoutes.route('/')
  .get(
    verifyJWT,
    verifyPermission(permissions.academicLeague.view),
    AcademicLeagueController.get,
  )
  .post(
    verifyJWT,
    verifyPermission(permissions.academicLeague.create),
    AcademicLeagueController.create,
  );

AcademicLeagueRoutes.route('/:_id')
  .get(
    verifyJWT,
    verifyPermission(permissions.academicLeague.view),
    AcademicLeagueController.getById,
  )
  .patch(
    verifyJWT,
    verifyPermission(permissions.academicLeague.edit),
    AcademicLeagueController.update,
  )
  .delete(
    verifyJWT,
    verifyPermission(permissions.academicLeague.delete),
    AcademicLeagueController.destroy,
  );

export default AcademicLeagueRoutes;
