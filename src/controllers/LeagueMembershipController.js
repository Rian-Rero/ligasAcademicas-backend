import * as LeagueMembershipService from '../services/LeagueMembershipService.js';
import asyncHandler from '../utils/general/asyncHandler.js';
import { SUCCESS_CODES } from '../utils/general/constants.js';
import * as LeagueMembershipValidator from '../validators/LeagueMembershipValidator.js';

export const get = asyncHandler(async (req, res) => {
  const inputFilters = LeagueMembershipValidator.get(req);
  const leagueMemberships = await LeagueMembershipService.get(inputFilters);

  res.status(SUCCESS_CODES.OK).json(leagueMemberships);
});

export const getById = asyncHandler(async (req, res) => {
  const { _id } = LeagueMembershipValidator.getById(req);
  const leagueMembership = await LeagueMembershipService.getById(_id);

  res.status(SUCCESS_CODES.OK).json(leagueMembership);
});

export const create = asyncHandler(async (req, res) => {
  const inputData = LeagueMembershipValidator.create(req);
  const newLeagueMembership = await LeagueMembershipService.create(inputData);

  res.status(SUCCESS_CODES.CREATED).json(newLeagueMembership);
});

export const update = asyncHandler(async (req, res) => {
  const { _id, ...inputData } = LeagueMembershipValidator.update(req);
  const updatedLeagueMembership = await LeagueMembershipService.update({
    _id,
    inputData,
  });

  res.status(SUCCESS_CODES.OK).json(updatedLeagueMembership);
});

export const destroy = asyncHandler(async (req, res) => {
  const { _id } = LeagueMembershipValidator.destroy(req);
  await LeagueMembershipService.destroy(_id);

  res.sendStatus(SUCCESS_CODES.NO_CONTENT);
});

export const end = asyncHandler(async (req, res) => {
  const { _id } = LeagueMembershipValidator.getById(req);
  const updatedLeagueMembership = await LeagueMembershipService.end(_id);

  res.status(SUCCESS_CODES.OK).json(updatedLeagueMembership);
});
