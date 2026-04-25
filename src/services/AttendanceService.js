import { ConflictError, NotFoundError } from '../errors/baseErrors.js';
import AttendanceModel from '../models/Attendance.js';
import EventModel from '../models/EventModel.js';
import LeagueMembershipModel from '../models/LeagueMembershipModel.js';

function isSameObjectId(left, right) {
  return left?.toString() === right?.toString();
}

async function validateLinkedData({ event, leagueMembership }) {
  const [foundEvent, foundLeagueMembership] = await Promise.all([
    EventModel.findById(event).select({ academicLeague: 1 }).lean().exec(),
    LeagueMembershipModel.findById(leagueMembership)
      .select({ academicLeague: 1 })
      .lean()
      .exec(),
  ]);

  if (!foundEvent) throw new NotFoundError('Event not found');
  if (!foundLeagueMembership)
    throw new NotFoundError('League membership not found');

  if (
    !isSameObjectId(
      foundEvent.academicLeague,
      foundLeagueMembership.academicLeague,
    )
  ) {
    throw new ConflictError(
      'Event and league membership must belong to the same academic league',
    );
  }
}

async function validateUniqueAttendance({ _id, event, leagueMembership }) {
  const filter = {
    event,
    leagueMembership,
    ...(_id && { _id: { $ne: _id } }),
  };

  const foundAttendance = await AttendanceModel.exists(filter).exec();
  if (foundAttendance) {
    throw new ConflictError(
      'Attendance already exists for this event and league membership',
    );
  }
}

export async function get(inputFilters) {
  return AttendanceModel.find(inputFilters).lean().exec();
}

export async function getById(_id) {
  const foundAttendance = await AttendanceModel.findById(_id).lean().exec();
  if (!foundAttendance) throw new NotFoundError('Attendance not found');

  return foundAttendance;
}

export async function create(inputData) {
  await validateLinkedData(inputData);
  await validateUniqueAttendance(inputData);

  const dataToSave = {
    ...inputData,
    ...(inputData.hasAttended &&
      !inputData.isConfirmed && { isConfirmed: true }),
  };

  return (await AttendanceModel.create(dataToSave)).toObject();
}

export async function update({ _id, inputData }) {
  const foundAttendance = await AttendanceModel.findById(_id).exec();
  if (!foundAttendance) throw new NotFoundError('Attendance not found');

  const nextState = {
    event: inputData.event ?? foundAttendance.event,
    leagueMembership:
      inputData.leagueMembership ?? foundAttendance.leagueMembership,
  };

  await validateLinkedData(nextState);
  await validateUniqueAttendance({ _id, ...nextState });

  const dataToSave = {
    ...inputData,
    ...(inputData.hasAttended === true && { isConfirmed: true }),
  };

  return foundAttendance.set(dataToSave).save();
}

export async function destroy(_id) {
  const foundAttendance = await AttendanceModel.findById(_id).exec();
  if (!foundAttendance) throw new NotFoundError('Attendance not found');

  await foundAttendance.deleteOne();
}

export async function confirm(_id) {
  const foundAttendance = await AttendanceModel.findById(_id).exec();
  if (!foundAttendance) throw new NotFoundError('Attendance not found');

  return foundAttendance.set({ isConfirmed: true }).save();
}

export async function markAttendance({ _id, hasAttended }) {
  const foundAttendance = await AttendanceModel.findById(_id).exec();
  if (!foundAttendance) throw new NotFoundError('Attendance not found');

  return foundAttendance
    .set({
      hasAttended,
      ...(hasAttended && { isConfirmed: true }),
    })
    .save();
}
