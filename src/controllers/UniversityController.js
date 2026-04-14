import * as UniversityService from '../services/UniversityService.js';
import asyncHandler from '../utils/general/asyncHandler.js';
import { SUCCESS_CODES } from '../utils/general/constants.js';
import * as UniversityValidator from '../validators/UniversityValidator.js';

export const get = asyncHandler(async (req, res) => {
  const inputFilters = UniversityValidator.get(req);
  const universities = await UniversityService.get(inputFilters);

  res.status(SUCCESS_CODES.OK).json(universities);
});

export const getById = asyncHandler(async (req, res) => {
  const { _id } = UniversityValidator.getById(req);
  const university = await UniversityService.getById(_id);

  res.status(SUCCESS_CODES.OK).json(university);
});

export const create = asyncHandler(async (req, res) => {
  const inputData = UniversityValidator.create(req);
  const newUniversity = await UniversityService.create(inputData);

  res.status(SUCCESS_CODES.CREATED).json(newUniversity);
});

export const update = asyncHandler(async (req, res) => {
  const { _id, ...inputData } = UniversityValidator.update(req);
  const updatedUniversity = await UniversityService.update({
    _id,
    inputData,
  });

  res.status(SUCCESS_CODES.OK).json(updatedUniversity);
});

export const destroy = asyncHandler(async (req, res) => {
  const { _id } = UniversityValidator.destroy(req);
  await UniversityService.destroy(_id);

  res.sendStatus(SUCCESS_CODES.NO_CONTENT);
});
