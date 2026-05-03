import { ConflictError, NotFoundError } from '../errors/baseErrors.js';
import AcademicLeagueModel from '../models/AcademicLeagueModel.js';
import UniversityModel from '../models/UniversityModel.js';
import cloudinary from '../utils/libs/cloudinary/index.js';
import { cloudinaryFileSchema } from '../utils/libs/zod/cloudinaryFileSchemas.js';

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

export async function uploadLogo({ _id, file }) {
  const foundUniversity = await UniversityModel.findById(_id).exec();
  if (!foundUniversity) throw new NotFoundError('University not found');

  const previousLogoKey = foundUniversity.logo?.key;
  const extension = file.mimetype?.split('/')[1] || 'jpg';
  const publicId = `universities/logo/${_id}`;

  const { key, url } = await cloudinary.uploadFile({
    fileBuffer: file.buffer,
    fileName: `${_id}.${extension}`,
    publicId,
    resourceType: 'image',
  });
  const uploadedLogo = cloudinaryFileSchema.parse({ key, url });

  try {
    const updatedUniversity = await foundUniversity
      .set({ logo: uploadedLogo })
      .save();

    if (previousLogoKey && previousLogoKey !== uploadedLogo.key) {
      await cloudinary.deleteFile(previousLogoKey);
    }

    return updatedUniversity;
  } catch (error) {
    await cloudinary.deleteFile(key);
    throw error;
  }
}
