import { Router } from 'express';
import UserRoutes from './UsersRoutes.js';
import SessionRoutes from './SessionsRoutes.js';

const routes = Router();

routes.use('/', SessionRoutes).use('/users', UserRoutes);

export default routes;
