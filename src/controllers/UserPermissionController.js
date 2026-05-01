import * as UserPermissionService from '../services/UserPermissionService.js';
import asyncHandler from '../utils/general/asyncHandler.js';
import { SUCCESS_CODES } from '../utils/general/constants.js';
import * as UserPermissionValidator from '../validators/UserPermissionValidator.js';

export const getUserPermissions = asyncHandler(async (req, res) => {
  const { userId } = UserPermissionValidator.getUserPermissions(req);
  const { academicLeague } = req.query;

  const permissions = await UserPermissionService.getUserPermissions(
    userId,
    academicLeague || null,
  );

  res.status(SUCCESS_CODES.OK).json(permissions);
});

export const updateUserPermissions = asyncHandler(async (req, res) => {
  const validated = UserPermissionValidator.updateUserPermissions(req);
  const { userId, roles, permissions, academicLeague } = validated;

  const updatedPermissions = await UserPermissionService.updateUserPermissions(
    userId,
    { roles, permissions, academicLeague },
  );

  res.status(SUCCESS_CODES.OK).json(updatedPermissions);
});

export const addRoleToUser = asyncHandler(async (req, res) => {
  const validated = UserPermissionValidator.addRoleToUser(req);
  const { userId, roleId, academicLeague } = validated;

  const updatedPermissions = await UserPermissionService.addRoleToUser(
    userId,
    roleId,
    academicLeague,
  );

  res.status(SUCCESS_CODES.OK).json(updatedPermissions);
});

export const removeRoleFromUser = asyncHandler(async (req, res) => {
  const validated = UserPermissionValidator.removeRoleFromUser(req);
  const { userId, roleId, academicLeague } = validated;

  const updatedPermissions = await UserPermissionService.removeRoleFromUser(
    userId,
    roleId,
    academicLeague,
  );

  res.status(SUCCESS_CODES.OK).json(updatedPermissions);
});

export const addPermissionToUser = asyncHandler(async (req, res) => {
  const validated = UserPermissionValidator.addPermissionToUser(req);
  const { userId, permissionId, academicLeague } = validated;

  const updatedPermissions = await UserPermissionService.updateUserPermissions(
    userId,
    { permissions: [permissionId], academicLeague },
  );

  res.status(SUCCESS_CODES.OK).json(updatedPermissions);
});

export const removePermissionFromUser = asyncHandler(async (req, res) => {
  const validated = UserPermissionValidator.removePermissionFromUser(req);
  const { userId, permissionId, academicLeague } = validated;

  const userPermission = await UserPermissionService.updateUserPermissions(
    userId,
    { academicLeague },
  );

  // Remover a permissão
  if (userPermission?.permissions) {
    userPermission.permissions = userPermission.permissions.filter(
      (id) => id.toString() !== permissionId.toString(),
    );
  }

  res.status(SUCCESS_CODES.OK).json(userPermission);
});
