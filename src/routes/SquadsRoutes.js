import { Router } from 'express';

import * as SquadController from '../controllers/SquadController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import { verifyPermission } from '../middleware/verifyPermission.js';
import { permissions } from '../utils/general/constants.js';

const SquadRoutes = Router();

SquadRoutes.route('/')
  .get(verifyJWT, verifyPermission(permissions.squad.view), SquadController.get)
  .post(
    verifyJWT,
    verifyPermission(permissions.squad.create),
    SquadController.create,
  );

SquadRoutes.route('/:_id')
  .get(
    verifyJWT,
    verifyPermission(permissions.squad.view),
    SquadController.getById,
  )
  .patch(
    verifyJWT,
    verifyPermission(permissions.squad.edit),
    SquadController.update,
  )
  .delete(
    verifyJWT,
    verifyPermission(permissions.squad.delete),
    SquadController.destroy,
  );

export default SquadRoutes;
