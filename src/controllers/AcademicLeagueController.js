import * as AcademicLeagueService from '../services/AcademicLeagueService.js';
import asyncHandler from '../utils/general/asyncHandler.js';
import { SUCCESS_CODES } from '../utils/general/constants.js';
import * as AcademicLeagueValidator from '../validators/AcademicLeagueValidator.js';

export const get = asyncHandler(async (req, res) => {
  const inputFilters = AcademicLeagueValidator.get(req);
  const academicLeagues = await AcademicLeagueService.get(inputFilters);

  res.status(SUCCESS_CODES.OK).json(academicLeagues);
});

export const getById = asyncHandler(async (req, res) => {
  const { _id } = AcademicLeagueValidator.getById(req);
  const academicLeague = await AcademicLeagueService.getById(_id);

  res.status(SUCCESS_CODES.OK).json(academicLeague);
});

export const create = asyncHandler(async (req, res) => {
  const inputData = AcademicLeagueValidator.create(req);
  const newAcademicLeague = await AcademicLeagueService.create(inputData);

  res.status(SUCCESS_CODES.CREATED).json(newAcademicLeague);
});

export const update = asyncHandler(async (req, res) => {
  const { _id, ...inputData } = AcademicLeagueValidator.update(req);
  const updatedAcademicLeague = await AcademicLeagueService.update({
    _id,
    inputData,
  });

  res.status(SUCCESS_CODES.OK).json(updatedAcademicLeague);
});

export const destroy = asyncHandler(async (req, res) => {
  const { _id } = AcademicLeagueValidator.destroy(req);
  await AcademicLeagueService.destroy(_id);

  res.sendStatus(SUCCESS_CODES.NO_CONTENT);
});
