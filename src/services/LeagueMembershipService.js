import { ConflictError, NotFoundError } from '../errors/baseErrors.js';
import AcademicLeagueModel from '../models/AcademicLeagueModel.js';
import AttendanceModel from '../models/Attendance.js';
import CertificateModel from '../models/CertificateModel.js';
import LeagueMembershipModel from '../models/LeagueMembershipModel.js';
import RoleHistoryModel from '../models/RoleHistory.js';
import SquadModel from '../models/SquadModel.js';
import UserModel from '../models/UserModel.js';

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
  const [foundUser, foundAcademicLeague, foundSquad] = await Promise.all([
    UserModel.exists({ _id: inputData.user }).exec(),
    AcademicLeagueModel.exists({ _id: inputData.academicLeague }).exec(),
    SquadModel.findById(inputData.squad)
      .select({ academicLeague: 1 })
      .lean()
      .exec(),
  ]);

  if (!foundUser) throw new NotFoundError('User not found');
  if (!foundAcademicLeague)
    throw new NotFoundError('Academic league not found');
  if (!foundSquad) throw new NotFoundError('Squad not found');
  if (!isSameObjectId(foundSquad.academicLeague, inputData.academicLeague)) {
    throw new ConflictError(
      'Squad does not belong to informed academic league',
    );
  }

  return (await LeagueMembershipModel.create(inputData)).toObject();
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
  };

  const [foundUser, foundAcademicLeague, foundSquad] = await Promise.all([
    UserModel.exists({ _id: nextState.user }).exec(),
    AcademicLeagueModel.exists({ _id: nextState.academicLeague }).exec(),
    SquadModel.findById(nextState.squad)
      .select({ academicLeague: 1 })
      .lean()
      .exec(),
  ]);

  if (!foundUser) throw new NotFoundError('User not found');
  if (!foundAcademicLeague)
    throw new NotFoundError('Academic league not found');
  if (!foundSquad) throw new NotFoundError('Squad not found');
  if (!isSameObjectId(foundSquad.academicLeague, nextState.academicLeague)) {
    throw new ConflictError(
      'Squad does not belong to informed academic league',
    );
  }

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
