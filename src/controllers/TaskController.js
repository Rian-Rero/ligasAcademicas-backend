import * as TaskService from '../services/TaskService.js';
import asyncHandler from '../utils/general/asyncHandler.js';
import { SUCCESS_CODES } from '../utils/general/constants.js';
import * as TaskValidator from '../validators/TaskValidator.js';

export const get = asyncHandler(async (req, res) => {
  const inputFilters = TaskValidator.get(req);
  const tasks = await TaskService.get(inputFilters);

  res.status(SUCCESS_CODES.OK).json(tasks);
});

export const getById = asyncHandler(async (req, res) => {
  const { _id } = TaskValidator.getById(req);
  const task = await TaskService.getById(_id);

  res.status(SUCCESS_CODES.OK).json(task);
});

export const create = asyncHandler(async (req, res) => {
  const inputData = TaskValidator.create(req);
  const newTask = await TaskService.create({
    inputData,
    actorUserId: req.user?._id,
  });

  res.status(SUCCESS_CODES.CREATED).json(newTask);
});

export const update = asyncHandler(async (req, res) => {
  const { _id, ...inputData } = TaskValidator.update(req);
  const updatedTask = await TaskService.update({
    _id,
    inputData,
    actorUserId: req.user?._id,
  });

  res.status(SUCCESS_CODES.OK).json(updatedTask);
});

export const completeTask = asyncHandler(async (req, res) => {
  const { _id } = TaskValidator.completeTask(req);
  const completedTask = await TaskService.completeTask({
    _id,
    actorUserId: req.user?._id,
  });

  res.status(SUCCESS_CODES.OK).json(completedTask);
});

export const destroy = asyncHandler(async (req, res) => {
  const { _id } = TaskValidator.destroy(req);
  await TaskService.destroy({ _id, actorUserId: req.user?._id });

  res.sendStatus(SUCCESS_CODES.NO_CONTENT);
});
