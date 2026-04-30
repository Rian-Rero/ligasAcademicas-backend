import * as EventService from '../services/EventService.js';
import asyncHandler from '../utils/general/asyncHandler.js';
import { SUCCESS_CODES } from '../utils/general/constants.js';
import * as EventValidator from '../validators/EventValidator.js';

export const get = asyncHandler(async (req, res) => {
  const inputFilters = EventValidator.get(req);
  const events = await EventService.get(inputFilters);

  res.status(SUCCESS_CODES.OK).json(events);
});

export const getById = asyncHandler(async (req, res) => {
  const { _id } = EventValidator.getById(req);
  const event = await EventService.getById(_id);

  res.status(SUCCESS_CODES.OK).json(event);
});

export const create = asyncHandler(async (req, res) => {
  const inputData = EventValidator.create(req);
  const newEvent = await EventService.create({
    inputData,
    actorUserId: req.user?._id,
  });

  res.status(SUCCESS_CODES.CREATED).json(newEvent);
});

export const update = asyncHandler(async (req, res) => {
  const { _id, ...inputData } = EventValidator.update(req);
  const updatedEvent = await EventService.update({
    _id,
    inputData,
    actorUserId: req.user?._id,
  });

  res.status(SUCCESS_CODES.OK).json(updatedEvent);
});

export const destroy = asyncHandler(async (req, res) => {
  const { _id } = EventValidator.destroy(req);
  await EventService.destroy({ _id, actorUserId: req.user?._id });

  res.sendStatus(SUCCESS_CODES.NO_CONTENT);
});

export const getEngagementById = asyncHandler(async (req, res) => {
  const { _id } = EventValidator.getEngagementById(req);
  const eventEngagement = await EventService.getEngagementById(_id);

  res.status(SUCCESS_CODES.OK).json(eventEngagement);
});
