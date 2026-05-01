import * as PermissionService from '../services/PermissionService.js';
import asyncHandler from '../utils/general/asyncHandler.js';
import { SUCCESS_CODES } from '../utils/general/constants.js';
import * as PermissionValidator from '../validators/PermissionValidator.js';

export const get = asyncHandler(async (req, res) => {
  const { module, isSystem } = PermissionValidator.get(req);
  const filters = {};

  if (module) {
    filters.module = module;
  }

  if (isSystem !== undefined) {
    filters.isSystem = isSystem;
  }

  const permissions = await PermissionService.get(filters);

  res.status(SUCCESS_CODES.OK).json(permissions);
});

export const getById = asyncHandler(async (req, res) => {
  const { _id } = PermissionValidator.getById(req);
  const permission = await PermissionService.getById(_id);

  res.status(SUCCESS_CODES.OK).json(permission);
});

export const create = asyncHandler(async (req, res) => {
  const inputData = PermissionValidator.create(req);
  const newPermission = await PermissionService.create(inputData);

  res.status(SUCCESS_CODES.CREATED).json(newPermission);
});

export const update = asyncHandler(async (req, res) => {
  const validated = PermissionValidator.update(req);
  const { _id, ...inputData } = validated;
  const updatedPermission = await PermissionService.update({
    _id,
    inputData,
  });

  res.status(SUCCESS_CODES.OK).json(updatedPermission);
});

export const destroy = asyncHandler(async (req, res) => {
  const { _id } = PermissionValidator.destroy(req);
  await PermissionService.destroy(_id);

  res.sendStatus(SUCCESS_CODES.NO_CONTENT);
});
