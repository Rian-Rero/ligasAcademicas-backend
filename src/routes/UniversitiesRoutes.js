import { Router } from 'express';

import * as UniversityController from '../controllers/UniversityController.js';

const UniversityRoutes = Router();

UniversityRoutes.route('/')
  .get(UniversityController.get)
  .post(UniversityController.create);

UniversityRoutes.route('/:_id')
  .get(UniversityController.getById)
  .patch(UniversityController.update)
  .delete(UniversityController.destroy);

export default UniversityRoutes;
