import * as SquadService from '../services/SquadService.js';
import asyncHandler from '../utils/general/asyncHandler.js';
import { SUCCESS_CODES } from '../utils/general/constants.js';
import * as SquadValidator from '../validators/SquadValidator.js';

export const get = asyncHandler(async (req, res) => {
  const inputFilters = SquadValidator.get(req);
  const squads = await SquadService.get(inputFilters);

  res.status(SUCCESS_CODES.OK).json(squads);
});

export const getById = asyncHandler(async (req, res) => {
  const { _id } = SquadValidator.getById(req);
  const squad = await SquadService.getById(_id);

  res.status(SUCCESS_CODES.OK).json(squad);
});

export const create = asyncHandler(async (req, res) => {
  const inputData = SquadValidator.create(req);
  const newSquad = await SquadService.create(inputData);

  res.status(SUCCESS_CODES.CREATED).json(newSquad);
});

export const update = asyncHandler(async (req, res) => {
  const { _id, ...inputData } = SquadValidator.update(req);
  const updatedSquad = await SquadService.update({
    _id,
    inputData,
  });

  res.status(SUCCESS_CODES.OK).json(updatedSquad);
});

export const destroy = asyncHandler(async (req, res) => {
  const { _id } = SquadValidator.destroy(req);
  await SquadService.destroy(_id);

  res.sendStatus(SUCCESS_CODES.NO_CONTENT);
});
