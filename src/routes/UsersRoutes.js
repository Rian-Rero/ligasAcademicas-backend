import { Router } from 'express';
import * as UserController from '../controllers/UserController.js';

const UserRoutes = Router();

UserRoutes.route('/').get(UserController.get).post(UserController.create);

export default UserRoutes;
