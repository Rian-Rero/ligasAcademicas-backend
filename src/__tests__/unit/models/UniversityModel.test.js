import { describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';

import UniversityModel from '../../../models/UniversityModel.js';

vi.mock('../../../utils/libs/cloudinary/index.js', () => ({
  default: {
    uploadFile: vi.fn().mockResolvedValue({
      url: 'https://cdn.test/logo.jpg',
      key: 'universities/logo/123',
    }),
    deleteFile: vi.fn().mockResolvedValue(true),
  },
}));

async function getCloudinary() {
  return (await import('../../../utils/libs/cloudinary/index.js')).default;
}

describe('UniversityModel schema validation', () => {
  it('creates a university with all required fields', async () => {
    const university = await UniversityModel.create({
      name: 'Federal University',
      street: 'Av. Presidente Antonio Carlos',
      number: 6627,
    });

    expect(university.name).toBe('Federal University');
    expect(university.street).toBe('Av. Presidente Antonio Carlos');
    expect(university.number).toBe(6627);
    expect(university._id).toBeDefined();
  });

  it('rejects creation when name is missing', async () => {
    await expect(
      UniversityModel.create({ street: 'Rua X', number: 1 }),
    ).rejects.toThrow();
  });

  it('rejects creation when street is missing', async () => {
    await expect(
      UniversityModel.create({ name: 'Uni Sem Rua', number: 1 }),
    ).rejects.toThrow();
  });

  it('rejects creation when number is missing', async () => {
    await expect(
      UniversityModel.create({ name: 'Uni Sem Numero', street: 'Rua Y' }),
    ).rejects.toThrow();
  });

  it('trims whitespace from name and street', async () => {
    const university = await UniversityModel.create({
      name: '  Uni Trim  ',
      street: '  Rua Trim  ',
      number: 10,
    });

    expect(university.name).toBe('Uni Trim');
    expect(university.street).toBe('Rua Trim');
  });

  it('complement is optional and stores trimmed value', async () => {
    const university = await UniversityModel.create({
      name: 'Uni com Complemento',
      street: 'Rua Z',
      number: 5,
      complement: '  Bloco B  ',
    });

    expect(university.complement).toBe('Bloco B');
  });

  it('logo defaults to undefined', async () => {
    const university = await UniversityModel.create({
      name: 'Uni Sem Logo',
      street: 'Rua W',
      number: 3,
    });

    expect(university.logo).toBeUndefined();
  });

  it('logo subdocument accepts key and url', async () => {
    const university = await UniversityModel.create({
      name: 'Uni Com Logo',
      street: 'Rua L',
      number: 7,
      logo: { key: 'universities/logo/abc', url: 'https://cdn.test/abc.jpg' },
    });

    expect(university.logo.key).toBe('universities/logo/abc');
    expect(university.logo.url).toBe('https://cdn.test/abc.jpg');
  });

  it('adds createdAt and updatedAt timestamps', async () => {
    const university = await UniversityModel.create({
      name: 'Uni Timestamp',
      street: 'Rua T',
      number: 99,
    });

    expect(university.createdAt).toBeInstanceOf(Date);
    expect(university.updatedAt).toBeInstanceOf(Date);
  });
});

describe('UniversityModel deleteOne (document hook)', () => {
  it('calls cloudinary.deleteFile when document has a logo key', async () => {
    const cloudinary = await getCloudinary();
    cloudinary.deleteFile.mockClear();

    const university = await UniversityModel.create({
      name: 'Uni Logo Delete',
      street: 'Rua D',
      number: 1,
      logo: {
        key: 'universities/logo/to-delete',
        url: 'https://cdn.test/to-delete.jpg',
      },
    });

    await university.deleteOne();

    expect(cloudinary.deleteFile).toHaveBeenCalledWith(
      'universities/logo/to-delete',
    );
  });

  it('does not call cloudinary.deleteFile when document has no logo', async () => {
    const cloudinary = await getCloudinary();
    cloudinary.deleteFile.mockClear();

    const university = await UniversityModel.create({
      name: 'Uni No Logo Delete',
      street: 'Rua E',
      number: 2,
    });

    await university.deleteOne();

    expect(cloudinary.deleteFile).not.toHaveBeenCalled();
  });
});

describe('UniversityModel deleteOne (query hook)', () => {
  it('calls cloudinary.deleteFile when matching university has a logo', async () => {
    const cloudinary = await getCloudinary();
    cloudinary.deleteFile.mockClear();

    const university = await UniversityModel.create({
      name: 'Uni Query Logo',
      street: 'Rua Q',
      number: 3,
      logo: {
        key: 'universities/logo/query-key',
        url: 'https://cdn.test/query.jpg',
      },
    });

    await UniversityModel.deleteOne({ _id: university._id });

    expect(cloudinary.deleteFile).toHaveBeenCalledWith(
      'universities/logo/query-key',
    );
  });

  it('does not call cloudinary.deleteFile when matched university has no logo', async () => {
    const cloudinary = await getCloudinary();
    cloudinary.deleteFile.mockClear();

    const university = await UniversityModel.create({
      name: 'Uni Query No Logo',
      street: 'Rua R',
      number: 4,
    });

    await UniversityModel.deleteOne({ _id: university._id });

    expect(cloudinary.deleteFile).not.toHaveBeenCalled();
  });

  it('does nothing when no university matches the query', async () => {
    const cloudinary = await getCloudinary();
    cloudinary.deleteFile.mockClear();

    await UniversityModel.deleteOne({
      _id: new mongoose.Types.ObjectId(),
    });

    expect(cloudinary.deleteFile).not.toHaveBeenCalled();
  });
});

describe('UniversityModel findOneAndDelete hook', () => {
  it('calls cloudinary.deleteFile when the found university has a logo', async () => {
    const cloudinary = await getCloudinary();
    cloudinary.deleteFile.mockClear();

    const university = await UniversityModel.create({
      name: 'Uni FindAndDel Logo',
      street: 'Rua F',
      number: 5,
      logo: {
        key: 'universities/logo/findanddel-key',
        url: 'https://cdn.test/findanddel.jpg',
      },
    });

    await UniversityModel.findOneAndDelete({ _id: university._id });

    expect(cloudinary.deleteFile).toHaveBeenCalledWith(
      'universities/logo/findanddel-key',
    );
  });

  it('does not call cloudinary.deleteFile when matched university has no logo', async () => {
    const cloudinary = await getCloudinary();
    cloudinary.deleteFile.mockClear();

    const university = await UniversityModel.create({
      name: 'Uni FindAndDel No Logo',
      street: 'Rua G',
      number: 6,
    });

    await UniversityModel.findOneAndDelete({ _id: university._id });

    expect(cloudinary.deleteFile).not.toHaveBeenCalled();
  });

  it('does nothing when no university matches', async () => {
    const cloudinary = await getCloudinary();
    cloudinary.deleteFile.mockClear();

    await UniversityModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(),
    });

    expect(cloudinary.deleteFile).not.toHaveBeenCalled();
  });
});
