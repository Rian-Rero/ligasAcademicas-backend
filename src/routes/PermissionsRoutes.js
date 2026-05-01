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
router.get(
  '/permissions',
  verifyJWT,
  verifyPermissionAdmin,
  PermissionController.get,
);
router.get(
  '/permissions/:_id',
  verifyJWT,
  verifyPermissionAdmin,
  PermissionController.getById,
);
router.post(
  '/permissions',
  verifyJWT,
  verifyPermissionAdmin,
  PermissionController.create,
);
router.patch(
  '/permissions/:_id',
  verifyJWT,
  verifyPermissionAdmin,
  PermissionController.update,
);
router.delete(
  '/permissions/:_id',
  verifyJWT,
  verifyPermissionAdmin,
  PermissionController.destroy,
);

// ===================
// PAPÉIS (Admin Only)
// ===================
router.get('/roles', verifyJWT, verifyPermissionAdmin, RoleController.get);
router.get(
  '/roles/:_id',
  verifyJWT,
  verifyPermissionAdmin,
  RoleController.getById,
);
router.post('/roles', verifyJWT, verifyPermissionAdmin, RoleController.create);
router.patch(
  '/roles/:_id',
  verifyJWT,
  verifyPermissionAdmin,
  RoleController.update,
);
router.delete(
  '/roles/:_id',
  verifyJWT,
  verifyPermissionAdmin,
  RoleController.destroy,
);

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
router.get(
  '/users/:userId/permissions',
  verifyJWT,
  verifyPermissionAdmin,
  UserPermissionController.getUserPermissions,
);
router.get(
  '/users/:userId/permissions/details',
  verifyJWT,
  verifyPermissionAdmin,
  UserPermissionController.getUserPermissionDetails,
);
router.patch(
  '/users/:userId/permissions',
  verifyJWT,
  verifyPermissionAdmin,
  UserPermissionController.updateUserPermissions,
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
