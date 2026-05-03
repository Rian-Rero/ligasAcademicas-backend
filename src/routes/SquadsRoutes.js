import { Router } from 'express';

import * as SquadController from '../controllers/SquadController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import { verifyPermission } from '../middleware/verifyPermission.js';

const SquadRoutes = Router();

SquadRoutes.route('/')
  .get(verifyJWT, verifyPermission('squad.view'), SquadController.get)
  .post(verifyJWT, verifyPermission('squad.create'), SquadController.create);

SquadRoutes.route('/:_id')
  .get(verifyJWT, verifyPermission('squad.view'), SquadController.getById)
  .patch(verifyJWT, verifyPermission('squad.edit'), SquadController.update)
  .delete(verifyJWT, verifyPermission('squad.delete'), SquadController.destroy);

export default SquadRoutes;
