import {
  BadRequest,
  ConflictError,
  NotFoundError,
} from '../errors/baseErrors.js';
import AcademicLeagueModel from '../models/AcademicLeagueModel.js';
import AttendanceModel from '../models/Attendance.js';
import EventModel from '../models/EventModel.js';
import LeagueMembershipModel from '../models/LeagueMembershipModel.js';
import SquadModel from '../models/SquadModel.js';
import UserModel from '../models/UserModel.js';
import * as GoogleCalendarService from './GoogleCalendarService.js';
import * as UserService from './UserService.js';
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

async function getUserWithGoogleTokens(userId) {
  if (!userId) return null;

  return UserModel.findById(userId)
    .select(
      '+googleCalendarLinked +googleCalendarAccessToken +googleCalendarRefreshToken +googleCalendarTokenExpiryDate +googleCalendarScope',
    )
    .lean()
    .exec();
}

async function getEventAudience({ academicLeague, squad }) {
  const membershipFilters = {
    academicLeague,
    isActive: true,
  };

  if (squad) {
    membershipFilters.squad = squad;
  }

  const memberships = await LeagueMembershipModel.find(membershipFilters)
    .select({ user: 1 })
    .lean()
    .exec();

  const userIds = [
    ...new Set(
      memberships
        .map((membership) => membership.user?.toString())
        .filter(Boolean),
    ),
  ];

  if (!userIds.length) {
    return { attendees: [], userIds: [] };
  }

  const users = await UserModel.find({ _id: { $in: userIds } })
    .select({ email: 1, name: 1 })
    .lean()
    .exec();

  return {
    attendees: users
      .map((user) => ({
        email: user.email,
        displayName: user.name || undefined,
      }))
      .filter((attendee) => attendee.email),
    userIds,
  };
}

async function getGoogleCalendarOwnerUserId({ actorUserId, userIds }) {
  const candidateIds = [actorUserId, ...userIds].filter(Boolean);

  if (!candidateIds.length) return null;

  const foundUser = await UserModel.findOne({
    _id: { $in: candidateIds },
    googleCalendarLinked: true,
    googleCalendarRefreshToken: { $ne: null },
  })
    .select({ _id: 1 })
    .lean()
    .exec();

  return foundUser?._id?.toString() || null;
}

function ensureGoogleIsLinked(userData) {
  return Boolean(
    userData?.googleCalendarLinked && userData?.googleCalendarRefreshToken,
  );
}

function toGoogleSyncError(prefix, error) {
  return new BadRequest(`${prefix}: ${error?.message || 'Unknown error'}`);
}

function composeNextEventData(foundEvent, inputData) {
  return {
    ...foundEvent.toObject(),
    ...inputData,
  };
}

async function persistRefreshedUserTokens(userId, tokenData) {
  if (!tokenData) return;

  await UserService.updateGoogleCalendarTokens(userId, tokenData);
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

export async function create({ inputData, actorUserId }) {
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

  const createdEvent = await EventModel.create(inputData);
  const { attendees, userIds } = await getEventAudience({
    academicLeague: inputData.academicLeague,
    squad: inputData.squad,
  });
  const googleCalendarOwnerUserId = await getGoogleCalendarOwnerUserId({
    actorUserId,
    userIds,
  });

  if (!googleCalendarOwnerUserId) return createdEvent.toObject();

  const actorUser = await getUserWithGoogleTokens(googleCalendarOwnerUserId);
  if (!ensureGoogleIsLinked(actorUser)) return createdEvent.toObject();

  try {
    const { googleEventId, refreshedTokenData } =
      await GoogleCalendarService.createGoogleCalendarEvent({
        userTokens: actorUser,
        event: { ...createdEvent.toObject(), attendees },
      });

    createdEvent.googleCalendarEventId = googleEventId;
    createdEvent.googleCalendarUserId = googleCalendarOwnerUserId;

    await Promise.all([
      createdEvent.save(),
      persistRefreshedUserTokens(googleCalendarOwnerUserId, refreshedTokenData),
    ]);

    return createdEvent.toObject();
  } catch (error) {
    await createdEvent.deleteOne();
    throw toGoogleSyncError(
      'Failed to sync event with Google Calendar during creation',
      error,
    );
  }
}

export async function update({ _id, inputData, actorUserId }) {
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

  const nextEvent = composeNextEventData(foundEvent, inputData);
  const { attendees: nextAttendees, userIds: nextAudienceUserIds } =
    await getEventAudience({
      academicLeague: nextEvent.academicLeague,
      squad: nextEvent.squad,
    });
  const googleCalendarOwnerUserId =
    foundEvent.googleCalendarUserId ||
    (await getGoogleCalendarOwnerUserId({
      actorUserId,
      userIds: nextAudienceUserIds,
    }));
  const googleSyncPatch = {};

  if (foundEvent.googleCalendarEventId && googleCalendarOwnerUserId) {
    const googleOwner = await getUserWithGoogleTokens(
      googleCalendarOwnerUserId,
    );
    if (ensureGoogleIsLinked(googleOwner)) {
      try {
        const { refreshedTokenData } =
          await GoogleCalendarService.updateGoogleCalendarEvent({
            userTokens: googleOwner,
            event: { ...nextEvent, attendees: nextAttendees },
            googleEventId: foundEvent.googleCalendarEventId,
          });

        await persistRefreshedUserTokens(
          googleCalendarOwnerUserId,
          refreshedTokenData,
        );
      } catch (error) {
        throw toGoogleSyncError(
          'Failed to sync event update with Google Calendar',
          error,
        );
      }
    }
  } else if (actorUserId) {
    const actorUser = await getUserWithGoogleTokens(actorUserId);
    if (ensureGoogleIsLinked(actorUser)) {
      try {
        const { googleEventId, refreshedTokenData } =
          await GoogleCalendarService.createGoogleCalendarEvent({
            userTokens: actorUser,
            event: { ...nextEvent, attendees: nextAttendees },
          });

        googleSyncPatch.googleCalendarEventId = googleEventId;
        googleSyncPatch.googleCalendarUserId = actorUserId;

        await persistRefreshedUserTokens(actorUserId, refreshedTokenData);
      } catch (error) {
        throw toGoogleSyncError(
          'Failed to sync event update with Google Calendar',
          error,
        );
      }
    }
  }

  return foundEvent.set({ ...inputData, ...googleSyncPatch }).save();
}

export async function destroy({ _id }) {
  const [foundEvent, hasAttendance] = await Promise.all([
    EventModel.findById(_id).exec(),
    AttendanceModel.exists({ event: _id }).exec(),
  ]);

  if (!foundEvent) throw new NotFoundError('Event not found');
  if (hasAttendance)
    throw new ConflictError('Cannot delete event with linked attendance data');

  if (foundEvent.googleCalendarEventId && foundEvent.googleCalendarUserId) {
    const googleOwner = await getUserWithGoogleTokens(
      foundEvent.googleCalendarUserId,
    );

    if (ensureGoogleIsLinked(googleOwner)) {
      try {
        const { refreshedTokenData } =
          await GoogleCalendarService.deleteGoogleCalendarEvent({
            userTokens: googleOwner,
            googleEventId: foundEvent.googleCalendarEventId,
          });

        await persistRefreshedUserTokens(
          foundEvent.googleCalendarUserId,
          refreshedTokenData,
        );
      } catch (error) {
        throw toGoogleSyncError(
          'Failed to remove event from Google Calendar',
          error,
        );
      }
    }
  }

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
