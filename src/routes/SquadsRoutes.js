import { Router } from 'express';

import * as SquadController from '../controllers/SquadController.js';

const SquadRoutes = Router();

SquadRoutes.route('/').get(SquadController.get).post(SquadController.create);

SquadRoutes.route('/:_id')
  .get(SquadController.getById)
  .patch(SquadController.update)
  .delete(SquadController.destroy);

export default SquadRoutes;
