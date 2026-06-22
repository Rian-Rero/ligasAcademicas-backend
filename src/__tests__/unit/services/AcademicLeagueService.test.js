import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';

import { ConflictError, NotFoundError } from '../../../errors/baseErrors.js';
import AcademicLeagueModel from '../../../models/AcademicLeagueModel.js';
import EventModel from '../../../models/EventModel.js';
import LeagueMembershipModel from '../../../models/LeagueMembershipModel.js';
import SquadModel from '../../../models/SquadModel.js';
import * as AcademicLeagueService from '../../../services/AcademicLeagueService.js';
import {
  createAcademicLeague,
  createUniversity,
} from '../../helpers/factories.js';

describe('AcademicLeagueService.get', () => {
  it('returns an empty array when no leagues exist', async () => {
    const result = await AcademicLeagueService.get({});
    expect(result).toEqual([]);
  });

  it('returns all leagues when called with no filters', async () => {
    const university = await createUniversity();
    await createAcademicLeague(university._id);
    await createAcademicLeague(university._id);

    const result = await AcademicLeagueService.get({});
    expect(result).toHaveLength(2);
  });

  it('filters leagues by university', async () => {
    const uniA = await createUniversity();
    const uniB = await createUniversity();
    await createAcademicLeague(uniA._id);
    await createAcademicLeague(uniB._id);

    const result = await AcademicLeagueService.get({
      university: uniA._id,
    });
    expect(result).toHaveLength(1);
    expect(result[0].university.toString()).toBe(uniA._id.toString());
  });

  it('returns lean plain objects (no mongoose document methods)', async () => {
    const university = await createUniversity();
    await createAcademicLeague(university._id);

    const [item] = await AcademicLeagueService.get({});
    expect(typeof item.save).toBe('undefined');
    expect(item._id).toBeDefined();
  });
});

describe('AcademicLeagueService.getById', () => {
  it('returns the league when found', async () => {
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);

    const result = await AcademicLeagueService.getById(league._id);
    expect(result._id.toString()).toBe(league._id.toString());
    expect(result.name).toBe(league.name);
  });

  it('throws NotFoundError for a non-existent id', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    await expect(AcademicLeagueService.getById(fakeId)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('returns a lean plain object', async () => {
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);

    const result = await AcademicLeagueService.getById(league._id);
    expect(typeof result.save).toBe('undefined');
  });
});

describe('AcademicLeagueService.create', () => {
  it('creates a new league and returns the document object', async () => {
    const university = await createUniversity();

    const result = await AcademicLeagueService.create({
      university: university._id,
      name: 'Liga de Cirurgia',
      description: 'Liga focada em cirurgia geral',
    });

    expect(result.name).toBe('Liga de Cirurgia');
    expect(result.university.toString()).toBe(university._id.toString());
  });

  it('throws NotFoundError when the university does not exist', async () => {
    const fakeUniversityId = new mongoose.Types.ObjectId();

    await expect(
      AcademicLeagueService.create({
        university: fakeUniversityId,
        name: 'Liga Inexistente',
        description: 'Desc',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('AcademicLeagueService.update', () => {
  it('updates the league name', async () => {
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);

    const result = await AcademicLeagueService.update({
      _id: league._id,
      inputData: { name: 'Novo Nome' },
    });

    expect(result.name).toBe('Novo Nome');
  });

  it('throws NotFoundError when the league does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    await expect(
      AcademicLeagueService.update({
        _id: fakeId,
        inputData: { name: 'X' },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('updates with a new university when university field is provided and exists', async () => {
    const uniA = await createUniversity();
    const uniB = await createUniversity();
    const league = await createAcademicLeague(uniA._id);

    const result = await AcademicLeagueService.update({
      _id: league._id,
      inputData: { university: uniB._id },
    });

    expect(result.university.toString()).toBe(uniB._id.toString());
  });

  it('throws NotFoundError when updating to a non-existent university', async () => {
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const fakeUniversityId = new mongoose.Types.ObjectId();

    await expect(
      AcademicLeagueService.update({
        _id: league._id,
        inputData: { university: fakeUniversityId },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('skips university existence check when inputData.university is not provided', async () => {
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);

    const result = await AcademicLeagueService.update({
      _id: league._id,
      inputData: { description: 'Updated description' },
    });

    expect(result.description).toBe('Updated description');
  });
});

describe('AcademicLeagueService.destroy', () => {
  it('deletes a league successfully when no linked data exists', async () => {
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);

    await expect(
      AcademicLeagueService.destroy(league._id),
    ).resolves.toBeUndefined();

    const found = await AcademicLeagueModel.findById(league._id).exec();
    expect(found).toBeNull();
  });

  it('throws NotFoundError when league does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    await expect(AcademicLeagueService.destroy(fakeId)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('throws ConflictError when the league has linked squads', async () => {
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);

    await SquadModel.create({
      academicLeague: league._id,
      name: 'Squad Alpha',
      description: 'Squad desc',
    });

    await expect(
      AcademicLeagueService.destroy(league._id),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('throws ConflictError when the league has linked events', async () => {
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);

    await EventModel.create({
      academicLeague: league._id,
      title: 'Evento X',
      description: 'Desc',
      dateTime: new Date(),
      location: 'Sala 1',
    });

    await expect(
      AcademicLeagueService.destroy(league._id),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('throws ConflictError when the league has linked memberships', async () => {
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);

    await LeagueMembershipModel.create({
      academicLeague: league._id,
      user: new mongoose.Types.ObjectId(),
      role: 'member',
      isActive: true,
    });

    await expect(
      AcademicLeagueService.destroy(league._id),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
