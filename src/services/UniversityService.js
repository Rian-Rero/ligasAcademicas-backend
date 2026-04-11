import { ConflictError, NotFoundError } from '../errors/baseErrors.js';
import AcademicLeagueModel from '../models/AcademicLeagueModel.js';
import UniversityModel from '../models/UniversityModel.js';

export async function get(inputFilters) {
  return UniversityModel.find(inputFilters).lean().exec();
}

export async function getById(_id) {
  const foundUniversity = await UniversityModel.findById(_id).lean().exec();
  if (!foundUniversity) throw new NotFoundError('University not found');

  return foundUniversity;
}

export async function create(inputData) {
  return (await UniversityModel.create(inputData)).toObject();
}

export async function update({ _id, inputData }) {
  const foundUniversity = await UniversityModel.findById(_id).exec();
  if (!foundUniversity) throw new NotFoundError('University not found');

  return foundUniversity.set(inputData).save();
}

export async function destroy(_id) {
  const [foundUniversity, hasAcademicLeague] = await Promise.all([
    UniversityModel.findById(_id).exec(),
    AcademicLeagueModel.exists({ university: _id }).exec(),
  ]);

  if (!foundUniversity) throw new NotFoundError('University not found');
  if (hasAcademicLeague)
    throw new ConflictError('Cannot delete university with linked leagues');

  await foundUniversity.deleteOne();
}
