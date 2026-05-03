import { Router } from 'express';

import * as UniversityController from '../controllers/UniversityController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import { verifyPermission } from '../middleware/verifyPermission.js';

const UniversityRoutes = Router();

UniversityRoutes.route('/')
  .get(verifyJWT, verifyPermission('university.view'), UniversityController.get)
  .post(
    verifyJWT,
    verifyPermission('university.create'),
    UniversityController.create,
  );

UniversityRoutes.route('/:_id')
  .get(
    verifyJWT,
    verifyPermission('university.view'),
    UniversityController.getById,
  )
  .patch(
    verifyJWT,
    verifyPermission('university.edit'),
    UniversityController.update,
  )
  .delete(
    verifyJWT,
    verifyPermission('university.delete'),
    UniversityController.destroy,
  );

export default UniversityRoutes;
