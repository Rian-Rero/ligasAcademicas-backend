import { Router } from 'express';
import * as UserController from '../controllers/UserController.js';
import verifyManagement from '../middleware/verifyManagement.js';
import verifyJWT from '../middleware/verifyJWT.js';
import verifyOwnUser from '../middleware/verifyOwnUser.js';

const UserRoutes = Router();

UserRoutes.route('/')
  .get(verifyJWT, UserController.get)
  .post(verifyJWT, verifyManagement, UserController.create);

UserRoutes.put('/confirm-email/:token', UserController.verifyEmail);

UserRoutes.post('/forgot-password', UserController.forgotPassword);
UserRoutes.put('/forgot-password/:token', UserController.redefinePassword);

UserRoutes.route('/:_id')
  .get(UserController.getById)
  .put(verifyJWT, verifyOwnUser, UserController.update)
  .delete(verifyJWT, verifyOwnUser, UserController.destroy);
export default UserRoutes;
