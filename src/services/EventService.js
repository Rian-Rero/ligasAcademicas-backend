import { ConflictError, NotFoundError } from '../errors/baseErrors.js';
import AcademicLeagueModel from '../models/AcademicLeagueModel.js';
import AttendanceModel from '../models/Attendance.js';
import EventModel from '../models/EventModel.js';
import { ObjectId } from '../config/mongo.js';

export async function get(inputFilters) {
  const { startsAfter, startsBefore, ...dbFilters } = inputFilters;

  if (startsAfter || startsBefore) {
    dbFilters.dateTime = {
      ...(startsAfter && { $gte: startsAfter }),
      ...(startsBefore && { $lte: startsBefore }),
    };
  }

  return EventModel.find(dbFilters).sort({ dateTime: 1 }).lean().exec();
}

export async function getById(_id) {
  const foundEvent = await EventModel.findById(_id).lean().exec();
  if (!foundEvent) throw new NotFoundError('Event not found');

  return foundEvent;
}

export async function create(inputData) {
  const foundAcademicLeague = await AcademicLeagueModel.exists({
    _id: inputData.academicLeague,
  }).exec();
  if (!foundAcademicLeague)
    throw new NotFoundError('Academic league not found');

  return (await EventModel.create(inputData)).toObject();
}

export async function update({ _id, inputData }) {
  const foundEvent = await EventModel.findById(_id).exec();
  if (!foundEvent) throw new NotFoundError('Event not found');

  if (inputData.academicLeague) {
    const foundAcademicLeague = await AcademicLeagueModel.exists({
      _id: inputData.academicLeague,
    }).exec();
    if (!foundAcademicLeague)
      throw new NotFoundError('Academic league not found');

    if (
      foundEvent.academicLeague?.toString() !==
      inputData.academicLeague.toString()
    ) {
      const hasAttendance = await AttendanceModel.exists({ event: _id }).exec();
      if (hasAttendance) {
        throw new ConflictError(
          'Cannot change academic league for event with linked attendance data',
        );
      }
    }
  }

  return foundEvent.set(inputData).save();
}

export async function destroy(_id) {
  const [foundEvent, hasAttendance] = await Promise.all([
    EventModel.findById(_id).exec(),
    AttendanceModel.exists({ event: _id }).exec(),
  ]);

  if (!foundEvent) throw new NotFoundError('Event not found');
  if (hasAttendance)
    throw new ConflictError('Cannot delete event with linked attendance data');

  await foundEvent.deleteOne();
}

export async function getEngagementById(_id) {
  const foundEvent = await EventModel.findById(_id).lean().exec();
  if (!foundEvent) throw new NotFoundError('Event not found');

  const [engagementCounts] = await AttendanceModel.aggregate([
    {
      $match: {
        event: new ObjectId(_id),
      },
    },
    {
      $group: {
        _id: null,
        totalSubscriptions: { $sum: 1 },
        confirmedCount: {
          $sum: { $cond: ['$isConfirmed', 1, 0] },
        },
        attendedCount: {
          $sum: { $cond: ['$hasAttended', 1, 0] },
        },
      },
    },
  ]).exec();

  const {
    totalSubscriptions = 0,
    confirmedCount = 0,
    attendedCount = 0,
  } = engagementCounts ?? {};

  const absentCount = Math.max(confirmedCount - attendedCount, 0);
  const attendanceRate =
    confirmedCount === 0
      ? 0
      : Number((attendedCount / confirmedCount).toFixed(4));

  return {
    event: foundEvent,
    totalSubscriptions,
    confirmedCount,
    attendedCount,
    absentCount,
    pendingConfirmationCount: totalSubscriptions - confirmedCount,
    attendanceRate,
  };
}
