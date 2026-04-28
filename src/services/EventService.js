import { ConflictError, NotFoundError } from '../errors/baseErrors.js';
import AcademicLeagueModel from '../models/AcademicLeagueModel.js';
import AttendanceModel from '../models/Attendance.js';
import EventModel from '../models/EventModel.js';
import SquadModel from '../models/SquadModel.js';
import { ObjectId } from '../config/mongo.js';

function isSameObjectId(left, right) {
  return left?.toString() === right?.toString();
}

async function ensureSquadMatchesLeague({ squadId, academicLeagueId }) {
  const foundSquad = await SquadModel.findById(squadId)
    .select({ academicLeague: 1 })
    .lean()
    .exec();

  if (!foundSquad) throw new NotFoundError('Squad not found');
  if (!isSameObjectId(foundSquad.academicLeague, academicLeagueId)) {
    throw new ConflictError(
      'Squad does not belong to informed academic league',
    );
  }
}

export async function get(inputFilters) {
  const { startsAfter, startsBefore, squad, ...dbFilters } = inputFilters;

  if (squad) {
    dbFilters.$or = [{ squad }, { squad: null }];
  }

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

  if (inputData.squad) {
    await ensureSquadMatchesLeague({
      squadId: inputData.squad,
      academicLeagueId: inputData.academicLeague,
    });
  }

  return (await EventModel.create(inputData)).toObject();
}

export async function update({ _id, inputData }) {
  const foundEvent = await EventModel.findById(_id).exec();
  if (!foundEvent) throw new NotFoundError('Event not found');

  const hasAcademicLeagueUpdate = Object.prototype.hasOwnProperty.call(
    inputData,
    'academicLeague',
  );
  const hasSquadUpdate = Object.prototype.hasOwnProperty.call(
    inputData,
    'squad',
  );

  const nextAcademicLeague = hasAcademicLeagueUpdate
    ? inputData.academicLeague
    : foundEvent.academicLeague;
  const nextSquad = hasSquadUpdate ? inputData.squad : foundEvent.squad;

  if (inputData.academicLeague) {
    const foundAcademicLeague = await AcademicLeagueModel.exists({
      _id: inputData.academicLeague,
    }).exec();
    if (!foundAcademicLeague)
      throw new NotFoundError('Academic league not found');
  }

  if (nextSquad) {
    await ensureSquadMatchesLeague({
      squadId: nextSquad,
      academicLeagueId: nextAcademicLeague,
    });
  }

  const academicLeagueChanged =
    hasAcademicLeagueUpdate &&
    !isSameObjectId(foundEvent.academicLeague, nextAcademicLeague);
  const squadChanged =
    hasSquadUpdate && !isSameObjectId(foundEvent.squad, nextSquad);

  if (academicLeagueChanged || squadChanged) {
    const hasAttendance = await AttendanceModel.exists({ event: _id }).exec();
    if (hasAttendance) {
      throw new ConflictError(
        'Cannot change event scope for event with linked attendance data',
      );
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
