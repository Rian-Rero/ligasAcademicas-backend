import * as AttendanceService from '../services/AttendanceService.js';
import asyncHandler from '../utils/general/asyncHandler.js';
import { SUCCESS_CODES } from '../utils/general/constants.js';
import * as AttendanceValidator from '../validators/AttendanceValidator.js';

export const get = asyncHandler(async (req, res) => {
  const inputFilters = AttendanceValidator.get(req);
  const attendances = await AttendanceService.get(inputFilters);

  res.status(SUCCESS_CODES.OK).json(attendances);
});

export const getById = asyncHandler(async (req, res) => {
  const { _id } = AttendanceValidator.getById(req);
  const attendance = await AttendanceService.getById(_id);

  res.status(SUCCESS_CODES.OK).json(attendance);
});

export const create = asyncHandler(async (req, res) => {
  const inputData = AttendanceValidator.create(req);
  const newAttendance = await AttendanceService.create(inputData);

  res.status(SUCCESS_CODES.CREATED).json(newAttendance);
});

export const update = asyncHandler(async (req, res) => {
  const { _id, ...inputData } = AttendanceValidator.update(req);
  const updatedAttendance = await AttendanceService.update({ _id, inputData });

  res.status(SUCCESS_CODES.OK).json(updatedAttendance);
});

export const destroy = asyncHandler(async (req, res) => {
  const { _id } = AttendanceValidator.destroy(req);
  await AttendanceService.destroy(_id);

  res.sendStatus(SUCCESS_CODES.NO_CONTENT);
});

export const confirm = asyncHandler(async (req, res) => {
  const { _id } = AttendanceValidator.confirm(req);
  const confirmedAttendance = await AttendanceService.confirm(_id);

  res.status(SUCCESS_CODES.OK).json(confirmedAttendance);
});

export const markAttendance = asyncHandler(async (req, res) => {
  const { _id, hasAttended = true } = AttendanceValidator.markAttendance(req);
  const updatedAttendance = await AttendanceService.markAttendance({
    _id,
    hasAttended,
  });

  res.status(SUCCESS_CODES.OK).json(updatedAttendance);
});
