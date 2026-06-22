import { describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';

import { ConflictError, NotFoundError } from '../../../errors/baseErrors.js';
import UniversityModel from '../../../models/UniversityModel.js';
import * as UniversityService from '../../../services/UniversityService.js';
import {
  createAcademicLeague,
  createUniversity,
} from '../../helpers/factories.js';

vi.mock('../../../utils/libs/cloudinary/index.js', () => ({
  default: {
    uploadFile: vi.fn().mockResolvedValue({
      url: 'https://cdn.test/logo.jpg',
      key: 'universities/logo/123',
    }),
    deleteFile: vi.fn().mockResolvedValue(true),
  },
}));

describe('UniversityService.get', () => {
  it('returns an empty array when no universities exist', async () => {
    const result = await UniversityService.get({});
    expect(result).toEqual([]);
  });

  it('returns all universities', async () => {
    await createUniversity();
    await createUniversity();

    const result = await UniversityService.get({});
    expect(result).toHaveLength(2);
  });

  it('returns lean plain objects (no mongoose document methods)', async () => {
    await createUniversity();

    const [item] = await UniversityService.get({});
    expect(typeof item.save).toBe('undefined');
    expect(item._id).toBeDefined();
  });

  it('filters universities by name', async () => {
    await createUniversity({ name: 'UFMG' });
    await createUniversity({ name: 'USP' });

    const result = await UniversityService.get({ name: 'UFMG' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('UFMG');
  });
});

describe('UniversityService.getById', () => {
  it('returns the university when found', async () => {
    const university = await createUniversity();

    const result = await UniversityService.getById(university._id);
    expect(result._id.toString()).toBe(university._id.toString());
    expect(result.name).toBe(university.name);
  });

  it('throws NotFoundError for a non-existent id', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    await expect(UniversityService.getById(fakeId)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('returns a lean plain object', async () => {
    const university = await createUniversity();

    const result = await UniversityService.getById(university._id);
    expect(typeof result.save).toBe('undefined');
  });
});

describe('UniversityService.create', () => {
  it('creates a university and returns the document object', async () => {
    const result = await UniversityService.create({
      name: 'Universidade Federal',
      street: 'Av. Principal',
      number: 100,
    });

    expect(result.name).toBe('Universidade Federal');
    expect(result._id).toBeDefined();
  });

  it('persists the university to the database', async () => {
    const result = await UniversityService.create({
      name: 'Nova Universidade',
      street: 'Rua Secundária',
      number: 42,
    });

    const found = await UniversityModel.findById(result._id).lean().exec();
    expect(found).not.toBeNull();
    expect(found.name).toBe('Nova Universidade');
  });
});

describe('UniversityService.update', () => {
  it('updates the university name', async () => {
    const university = await createUniversity();

    const result = await UniversityService.update({
      _id: university._id,
      inputData: { name: 'Nome Atualizado' },
    });

    expect(result.name).toBe('Nome Atualizado');
  });

  it('throws NotFoundError when the university does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    await expect(
      UniversityService.update({
        _id: fakeId,
        inputData: { name: 'X' },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('updates address fields', async () => {
    const university = await createUniversity();

    const result = await UniversityService.update({
      _id: university._id,
      inputData: { street: 'Rua Nova', number: 999 },
    });

    expect(result.street).toBe('Rua Nova');
    expect(result.number).toBe(999);
  });
});

describe('UniversityService.destroy', () => {
  it('deletes a university successfully when no leagues are linked', async () => {
    const university = await createUniversity();

    await expect(
      UniversityService.destroy(university._id),
    ).resolves.toBeUndefined();

    const found = await UniversityModel.findById(university._id).lean().exec();
    expect(found).toBeNull();
  });

  it('throws NotFoundError when university does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    await expect(UniversityService.destroy(fakeId)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('throws ConflictError when university has linked academic leagues', async () => {
    const university = await createUniversity();
    await createAcademicLeague(university._id);

    await expect(
      UniversityService.destroy(university._id),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe('UniversityService.uploadLogo', () => {
  it('throws NotFoundError when university does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    await expect(
      UniversityService.uploadLogo({
        _id: fakeId,
        file: { buffer: Buffer.from('data'), mimetype: 'image/png' },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('uploads logo and returns updated university', async () => {
    const cloudinary = (await import('../../../utils/libs/cloudinary/index.js'))
      .default;
    cloudinary.uploadFile.mockResolvedValue({
      url: 'https://cdn.test/logo.jpg',
      key: 'universities/logo/abc',
    });

    const university = await createUniversity();

    const result = await UniversityService.uploadLogo({
      _id: university._id,
      file: { buffer: Buffer.from('imagedata'), mimetype: 'image/jpeg' },
    });

    expect(cloudinary.uploadFile).toHaveBeenCalled();
    expect(result.logo).toBeDefined();
    expect(result.logo.url).toBe('https://cdn.test/logo.jpg');
    expect(result.logo.key).toBe('universities/logo/abc');
  });

  it('deletes the previous logo when replacing with a new one', async () => {
    const cloudinary = (await import('../../../utils/libs/cloudinary/index.js'))
      .default;
    cloudinary.deleteFile.mockResolvedValue(true);

    const university = await createUniversity({
      logo: {
        key: 'universities/logo/old-key',
        url: 'https://cdn.test/old.jpg',
      },
    });

    cloudinary.uploadFile.mockResolvedValue({
      url: 'https://cdn.test/new.jpg',
      key: 'universities/logo/new-key',
    });

    await UniversityService.uploadLogo({
      _id: university._id,
      file: { buffer: Buffer.from('newdata'), mimetype: 'image/png' },
    });

    expect(cloudinary.deleteFile).toHaveBeenCalledWith(
      'universities/logo/old-key',
    );
  });

  it('does not delete the previous logo when the key is the same', async () => {
    const cloudinary = (await import('../../../utils/libs/cloudinary/index.js'))
      .default;
    cloudinary.deleteFile.mockClear();

    const sameKey = 'universities/logo/same-key';
    const university = await createUniversity({
      logo: { key: sameKey, url: 'https://cdn.test/same.jpg' },
    });

    cloudinary.uploadFile.mockResolvedValue({
      url: 'https://cdn.test/same.jpg',
      key: sameKey,
    });

    await UniversityService.uploadLogo({
      _id: university._id,
      file: { buffer: Buffer.from('data'), mimetype: 'image/png' },
    });

    expect(cloudinary.deleteFile).not.toHaveBeenCalledWith(sameKey);
  });

  it('deletes the newly uploaded file and re-throws when save fails', async () => {
    const cloudinary = (await import('../../../utils/libs/cloudinary/index.js'))
      .default;
    const { default: UniversityModelImport } =
      await import('../../../models/UniversityModel.js');

    const university = await createUniversity();

    cloudinary.uploadFile.mockResolvedValueOnce({
      url: 'https://cdn.test/catch.jpg',
      key: 'universities/logo/catch-key',
    });
    cloudinary.deleteFile.mockClear();

    const saveSpy = vi
      .spyOn(UniversityModelImport.prototype, 'save')
      .mockRejectedValueOnce(new Error('Simulated save failure'));

    await expect(
      UniversityService.uploadLogo({
        _id: university._id,
        file: { buffer: Buffer.from('data'), mimetype: 'image/png' },
      }),
    ).rejects.toThrow('Simulated save failure');

    expect(cloudinary.deleteFile).toHaveBeenCalledWith(
      'universities/logo/catch-key',
    );

    saveSpy.mockRestore();
  });

  it('uses jpg as default extension when mimetype is not provided', async () => {
    const cloudinary = (await import('../../../utils/libs/cloudinary/index.js'))
      .default;
    cloudinary.uploadFile.mockResolvedValue({
      url: 'https://cdn.test/logo.jpg',
      key: 'universities/logo/no-mime',
    });

    const university = await createUniversity();

    await UniversityService.uploadLogo({
      _id: university._id,
      file: { buffer: Buffer.from('data') },
    });

    const uploadCall = cloudinary.uploadFile.mock.calls.at(-1)[0];
    expect(uploadCall.fileName).toMatch(/\.jpg$/);
  });
});
