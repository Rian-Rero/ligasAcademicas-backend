import { ConflictError, NotFoundError } from '../errors/baseErrors.js';
import AcademicLeagueModel from '../models/AcademicLeagueModel.js';
import LeagueMembershipModel from '../models/LeagueMembershipModel.js';
import RoleHistoryModel from '../models/RoleHistory.js';
import SquadModel from '../models/SquadModel.js';

export async function get(inputFilters) {
  return SquadModel.find(inputFilters).lean().exec();
}

export async function getById(_id) {
  const foundSquad = await SquadModel.findById(_id).lean().exec();
  if (!foundSquad) throw new NotFoundError('Squad not found');

  return foundSquad;
}

export async function create(inputData) {
  const foundAcademicLeague = await AcademicLeagueModel.exists({
    _id: inputData.academicLeague,
  }).exec();
  if (!foundAcademicLeague)
    throw new NotFoundError('Academic league not found');

  return (await SquadModel.create(inputData)).toObject();
}

export async function update({ _id, inputData }) {
  const foundSquad = await SquadModel.findById(_id).exec();
  if (!foundSquad) throw new NotFoundError('Squad not found');

  if (inputData.academicLeague) {
    const foundAcademicLeague = await AcademicLeagueModel.exists({
      _id: inputData.academicLeague,
    }).exec();
    if (!foundAcademicLeague)
      throw new NotFoundError('Academic league not found');

    if (
      foundSquad.academicLeague?.toString() !==
      inputData.academicLeague.toString()
    ) {
      const [hasLeagueMembership, hasRoleHistory] = await Promise.all([
        LeagueMembershipModel.exists({ squad: _id }).exec(),
        RoleHistoryModel.exists({ squad: _id }).exec(),
      ]);

      if (hasLeagueMembership || hasRoleHistory) {
        throw new ConflictError(
          'Cannot change academic league for squad with linked data',
        );
      }
    }
  }

  return foundSquad.set(inputData).save();
}

export async function destroy(_id) {
  const [foundSquad, hasLeagueMembership, hasRoleHistory] = await Promise.all([
    SquadModel.findById(_id).exec(),
    LeagueMembershipModel.exists({ squad: _id }).exec(),
    RoleHistoryModel.exists({ squad: _id }).exec(),
  ]);

  if (!foundSquad) throw new NotFoundError('Squad not found');
  if (hasLeagueMembership || hasRoleHistory)
    throw new ConflictError('Cannot delete squad with linked data');

  await foundSquad.deleteOne();
}
