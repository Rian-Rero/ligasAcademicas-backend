import express from 'express';
import verifyJWT from '../middleware/verifyJWT.js';
import { verifyPermissionAdmin } from '../middleware/verifyPermission.js';
import * as PermissionController from '../controllers/PermissionController.js';
import * as RoleController from '../controllers/RoleController.js';
import * as UserPermissionController from '../controllers/UserPermissionController.js';

const router = express.Router();

// ===================
// PERMISSÕES (Admin Only)
// ===================
router
  .route('/')
  .get(verifyJWT, verifyPermissionAdmin, PermissionController.get)
  .post(verifyJWT, verifyPermissionAdmin, PermissionController.create);

router
  .route('/:_id')
  .get(verifyJWT, verifyPermissionAdmin, PermissionController.getById)
  .patch(verifyJWT, verifyPermissionAdmin, PermissionController.update)
  .delete(verifyJWT, verifyPermissionAdmin, PermissionController.destroy);

// ===================
// PAPÉIS (Admin Only)
// ===================
router
  .route('/roles')
  .get(verifyJWT, verifyPermissionAdmin, RoleController.get)
  .post(verifyJWT, verifyPermissionAdmin, RoleController.create);

router
  .route('/roles/:_id')
  .get(verifyJWT, verifyPermissionAdmin, RoleController.getById)
  .patch(verifyJWT, verifyPermissionAdmin, RoleController.update)
  .delete(verifyJWT, verifyPermissionAdmin, RoleController.destroy);

// Gerenciar permissões dentro de um papel
router.post(
  '/roles/:_id/permissions',
  verifyJWT,
  verifyPermissionAdmin,
  RoleController.addPermissionToRole,
);
router.delete(
  '/roles/:_id/permissions',
  verifyJWT,
  verifyPermissionAdmin,
  RoleController.removePermissionFromRole,
);

// ===================
// PERMISSÕES DE USUÁRIO (Admin Only)
// ===================
router
  .route('/users/:userId/permissions')
  .get(
    verifyJWT,
    verifyPermissionAdmin,
    UserPermissionController.getUserPermissions,
  )
  .patch(
    verifyJWT,
    verifyPermissionAdmin,
    UserPermissionController.updateUserPermissions,
  );

router.get(
  '/users/:userId/permissions/details',
  verifyJWT,
  verifyPermissionAdmin,
  UserPermissionController.getUserPermissionDetails,
);

// Gerenciar papéis de um usuário
router.post(
  '/users/:userId/roles',
  verifyJWT,
  verifyPermissionAdmin,
  UserPermissionController.addRoleToUser,
);
router.delete(
  '/users/:userId/roles',
  verifyJWT,
  verifyPermissionAdmin,
  UserPermissionController.removeRoleFromUser,
);

// Gerenciar permissões diretas de um usuário
router.post(
  '/users/:userId/permissions-direct',
  verifyJWT,
  verifyPermissionAdmin,
  UserPermissionController.addPermissionToUser,
);
router.delete(
  '/users/:userId/permissions-direct',
  verifyJWT,
  verifyPermissionAdmin,
  UserPermissionController.removePermissionFromUser,
);

export default router;
