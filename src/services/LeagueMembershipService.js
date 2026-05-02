import { ConflictError, NotFoundError } from '../errors/baseErrors.js';
import AcademicLeagueModel from '../models/AcademicLeagueModel.js';
import AttendanceModel from '../models/Attendance.js';
import CertificateModel from '../models/CertificateModel.js';
import LeagueMembershipModel from '../models/LeagueMembershipModel.js';
import RoleHistoryModel from '../models/RoleHistory.js';
import SquadModel from '../models/SquadModel.js';
import UserModel from '../models/UserModel.js';
import UniversityModel from '../models/UniversityModel.js';

function isSameObjectId(left, right) {
  return left?.toString() === right?.toString();
}

export async function get(inputFilters) {
  return LeagueMembershipModel.find(inputFilters).lean().exec();
}

export async function getById(_id) {
  const foundLeagueMembership = await LeagueMembershipModel.findById(_id)
    .lean()
    .exec();
  if (!foundLeagueMembership)
    throw new NotFoundError('League membership not found');

  return foundLeagueMembership;
}

export async function create(inputData) {
  const membershipType =
    inputData.membershipType ||
    (inputData.academicLeague ? 'league' : 'university');
  const foundUser = await UserModel.exists({ _id: inputData.user }).exec();
  if (!foundUser) throw new NotFoundError('User not found');

  if (membershipType === 'league') {
    if (!inputData.academicLeague || !inputData.squad) {
      throw new ConflictError(
        'League memberships require academicLeague and squad',
      );
    }

    const [foundAcademicLeague, foundSquad] = await Promise.all([
      AcademicLeagueModel.findById(inputData.academicLeague)
        .select({ university: 1 })
        .lean()
        .exec(),
      SquadModel.findById(inputData.squad)
        .select({ academicLeague: 1 })
        .lean()
        .exec(),
    ]);

    if (!foundAcademicLeague)
      throw new NotFoundError('Academic league not found');
    if (!foundSquad) throw new NotFoundError('Squad not found');
    if (!isSameObjectId(foundSquad.academicLeague, inputData.academicLeague)) {
      throw new ConflictError(
        'Squad does not belong to informed academic league',
      );
    }

    if (
      inputData.university &&
      !isSameObjectId(foundAcademicLeague.university, inputData.university)
    ) {
      throw new ConflictError(
        'Academic league does not belong to informed university',
      );
    }

    inputData.university = foundAcademicLeague.university;
    inputData.membershipType = 'league';
    return (
      await LeagueMembershipModel.create({
        ...inputData,
        university: foundAcademicLeague.university,
      })
    ).toObject();
  }

  if (membershipType !== 'university') {
    throw new ConflictError('Invalid membership type');
  }

  if (!inputData.university) {
    throw new ConflictError('University memberships require university');
  }

  const foundUniversity = await UniversityModel.exists({
    _id: inputData.university,
  }).exec();

  if (!foundUniversity) throw new NotFoundError('University not found');

  return (
    await LeagueMembershipModel.create({
      ...inputData,
      academicLeague: null,
      squad: null,
      membershipType: 'university',
    })
  ).toObject();
}

export async function update({ _id, inputData }) {
  const foundLeagueMembership =
    await LeagueMembershipModel.findById(_id).exec();
  if (!foundLeagueMembership)
    throw new NotFoundError('League membership not found');

  const nextState = {
    user: inputData.user ?? foundLeagueMembership.user,
    academicLeague:
      inputData.academicLeague ?? foundLeagueMembership.academicLeague,
    squad: inputData.squad ?? foundLeagueMembership.squad,
    university: inputData.university ?? foundLeagueMembership.university,
    membershipType:
      inputData.membershipType ||
      (inputData.academicLeague || foundLeagueMembership.academicLeague
        ? 'league'
        : 'university'),
  };

  const foundUser = await UserModel.exists({ _id: nextState.user }).exec();
  if (!foundUser) throw new NotFoundError('User not found');

  if (nextState.membershipType === 'league') {
    if (!nextState.academicLeague || !nextState.squad) {
      throw new ConflictError(
        'League memberships require academicLeague and squad',
      );
    }

    const [foundAcademicLeague, foundSquad] = await Promise.all([
      AcademicLeagueModel.findById(nextState.academicLeague)
        .select({ university: 1 })
        .lean()
        .exec(),
      SquadModel.findById(nextState.squad)
        .select({ academicLeague: 1 })
        .lean()
        .exec(),
    ]);

    if (!foundAcademicLeague)
      throw new NotFoundError('Academic league not found');
    if (!foundSquad) throw new NotFoundError('Squad not found');
    if (!isSameObjectId(foundSquad.academicLeague, nextState.academicLeague)) {
      throw new ConflictError(
        'Squad does not belong to informed academic league',
      );
    }

    if (
      nextState.university &&
      !isSameObjectId(foundAcademicLeague.university, nextState.university)
    ) {
      throw new ConflictError(
        'Academic league does not belong to informed university',
      );
    }

    foundLeagueMembership.university = foundAcademicLeague.university;

    return foundLeagueMembership.set(inputData).save();
  }

  if (nextState.membershipType !== 'university') {
    throw new ConflictError('Invalid membership type');
  }

  if (!nextState.university) {
    throw new ConflictError('University memberships require university');
  }

  const foundUniversity = await UniversityModel.exists({
    _id: nextState.university,
  }).exec();

  if (!foundUniversity) throw new NotFoundError('University not found');

  foundLeagueMembership.academicLeague = null;
  foundLeagueMembership.squad = null;
  foundLeagueMembership.university = nextState.university;

  return foundLeagueMembership.set(inputData).save();
}

export async function destroy(_id) {
  const [foundLeagueMembership, hasAttendance, hasCertificate, hasRoleHistory] =
    await Promise.all([
      LeagueMembershipModel.findById(_id).exec(),
      AttendanceModel.exists({ leagueMembership: _id }).exec(),
      CertificateModel.exists({ leagueMembership: _id }).exec(),
      RoleHistoryModel.exists({ leagueMembership: _id }).exec(),
    ]);

  if (!foundLeagueMembership)
    throw new NotFoundError('League membership not found');
  if (hasAttendance || hasCertificate || hasRoleHistory)
    throw new ConflictError('Cannot delete league membership with linked data');

  await foundLeagueMembership.deleteOne();
}

export async function end(_id) {
  const foundLeagueMembership =
    await LeagueMembershipModel.findById(_id).exec();
  if (!foundLeagueMembership)
    throw new NotFoundError('League membership not found');

  if (!foundLeagueMembership.isActive)
    throw new ConflictError('League membership already inactive');

  const startDate = foundLeagueMembership.createdAt || new Date();

  await RoleHistoryModel.create({
    leagueMembership: _id,
    squad: foundLeagueMembership.squad,
    startDate,
    endDate: new Date(),
  });

  foundLeagueMembership.isActive = false;
  return foundLeagueMembership.save();
}
