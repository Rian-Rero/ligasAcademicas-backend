import { Router } from 'express';

import * as AcademicLeagueController from '../controllers/AcademicLeagueController.js';

const AcademicLeagueRoutes = Router();

AcademicLeagueRoutes.route('/')
  .get(AcademicLeagueController.get)
  .post(AcademicLeagueController.create);

AcademicLeagueRoutes.route('/:_id')
  .get(AcademicLeagueController.getById)
  .patch(AcademicLeagueController.update)
  .delete(AcademicLeagueController.destroy);

export default AcademicLeagueRoutes;
