import * as RoleService from '../services/RoleService.js';
import asyncHandler from '../utils/general/asyncHandler.js';
import { SUCCESS_CODES } from '../utils/general/constants.js';
import * as RoleValidator from '../validators/RoleValidator.js';

export const get = asyncHandler(async (req, res) => {
  const validated = RoleValidator.get(req);
  const filters = {};

  if (validated.isGlobal !== undefined) {
    filters.isGlobal = validated.isGlobal;
  }

  if (validated.academicLeague) {
    filters.academicLeague = validated.academicLeague;
  }

  if (validated.isSystem !== undefined) {
    filters.isSystem = validated.isSystem;
  }

  if (validated.module) {
    filters.module = validated.module;
  }

  const roles = await RoleService.get(filters);

  res.status(SUCCESS_CODES.OK).json(roles);
});

export const getById = asyncHandler(async (req, res) => {
  const { _id } = RoleValidator.getById(req);
  const role = await RoleService.getById(_id);

  res.status(SUCCESS_CODES.OK).json(role);
});

export const create = asyncHandler(async (req, res) => {
  const inputData = RoleValidator.create(req);
  const newRole = await RoleService.create(inputData);

  res.status(SUCCESS_CODES.CREATED).json(newRole);
});

export const update = asyncHandler(async (req, res) => {
  const validated = RoleValidator.update(req);
  const { _id, ...inputData } = validated;
  const updatedRole = await RoleService.update({
    _id,
    inputData,
  });

  res.status(SUCCESS_CODES.OK).json(updatedRole);
});

export const destroy = asyncHandler(async (req, res) => {
  const { _id } = RoleValidator.destroy(req);
  await RoleService.destroy(_id);

  res.sendStatus(SUCCESS_CODES.NO_CONTENT);
});

export const addPermissionToRole = asyncHandler(async (req, res) => {
  const validated = RoleValidator.addPermissionToRole(req);
  const { _id, permissionId } = validated;
  const updatedRole = await RoleService.addPermissionToRole(_id, permissionId);

  res.status(SUCCESS_CODES.OK).json(updatedRole);
});

export const removePermissionFromRole = asyncHandler(async (req, res) => {
  const validated = RoleValidator.removePermissionFromRole(req);
  const { _id, permissionId } = validated;
  const updatedRole = await RoleService.removePermissionFromRole(
    _id,
    permissionId,
  );

  res.status(SUCCESS_CODES.OK).json(updatedRole);
});
