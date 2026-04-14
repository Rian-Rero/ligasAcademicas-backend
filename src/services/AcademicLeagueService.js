import { ConflictError, NotFoundError } from '../errors/baseErrors.js';
import AcademicLeagueModel from '../models/AcademicLeagueModel.js';
import EventModel from '../models/EventModel.js';
import LeagueMembershipModel from '../models/LeagueMembershipModel.js';
import SquadModel from '../models/SquadModel.js';
import UniversityModel from '../models/UniversityModel.js';

export async function get(inputFilters) {
  return AcademicLeagueModel.find(inputFilters).lean().exec();
}

export async function getById(_id) {
  const foundAcademicLeague = await AcademicLeagueModel.findById(_id)
    .lean()
    .exec();
  if (!foundAcademicLeague)
    throw new NotFoundError('Academic league not found');

  return foundAcademicLeague;
}

export async function create(inputData) {
  const foundUniversity = await UniversityModel.exists({
    _id: inputData.university,
  }).exec();
  if (!foundUniversity) throw new NotFoundError('University not found');

  return (await AcademicLeagueModel.create(inputData)).toObject();
}

export async function update({ _id, inputData }) {
  const foundAcademicLeague = await AcademicLeagueModel.findById(_id).exec();
  if (!foundAcademicLeague)
    throw new NotFoundError('Academic league not found');

  if (inputData.university) {
    const foundUniversity = await UniversityModel.exists({
      _id: inputData.university,
    }).exec();
    if (!foundUniversity) throw new NotFoundError('University not found');
  }

  return foundAcademicLeague.set(inputData).save();
}

export async function destroy(_id) {
  const [foundAcademicLeague, hasSquad, hasEvent, hasLeagueMembership] =
    await Promise.all([
      AcademicLeagueModel.findById(_id).exec(),
      SquadModel.exists({ academicLeague: _id }).exec(),
      EventModel.exists({ academicLeague: _id }).exec(),
      LeagueMembershipModel.exists({ academicLeague: _id }).exec(),
    ]);

  if (!foundAcademicLeague)
    throw new NotFoundError('Academic league not found');
  if (hasSquad || hasEvent || hasLeagueMembership)
    throw new ConflictError('Cannot delete academic league with linked data');

  await foundAcademicLeague.deleteOne();
}
