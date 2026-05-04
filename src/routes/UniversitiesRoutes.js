import { Router } from 'express';

import * as UniversityController from '../controllers/UniversityController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import { verifyPermission } from '../middleware/verifyPermission.js';
import { permissions } from '../utils/general/constants.js';

const UniversityRoutes = Router();

UniversityRoutes.route('/')
  .get(
    verifyJWT,
    verifyPermission(permissions.university.view),
    UniversityController.get,
  )
  .post(
    verifyJWT,
    verifyPermission(permissions.university.create),
    UniversityController.create,
  );

UniversityRoutes.route('/:_id')
  .get(
    verifyJWT,
    verifyPermission(permissions.university.view),
    UniversityController.getById,
  )
  .patch(
    verifyJWT,
    verifyPermission(permissions.university.edit),
    UniversityController.update,
  )
  .post(
    verifyJWT,
    verifyPermission(permissions.university.edit),
    ...UniversityController.uploadLogo,
  )
  .delete(
    verifyJWT,
    verifyPermission(permissions.university.delete),
    UniversityController.destroy,
  );

export default UniversityRoutes;
