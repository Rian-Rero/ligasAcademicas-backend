import mongoose from 'mongoose';

import { COLLECTION_NAMES } from '../utils/general/constants.js';
import CloudinaryFileSchema from '../utils/libs/mongoose/subdocuments/CloudinaryFileSchema.js';
import cloudinary from '../utils/libs/cloudinary/index.js';

async function deleteUniversityLogo(university) {
  if (!university) return null;

  if (university.logo?.key) {
    return cloudinary.deleteFile(university.logo.key);
  }

  return null;
}

async function deleteUniversityRelatedData(university) {
  if (!university?._id) return null;

  return deleteUniversityLogo(university);
}

const UniversitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    street: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: Number,
      required: true,
    },
    complement: {
      type: String,
      required: false,
      trim: true,
    },
    logo: {
      type: CloudinaryFileSchema,
      required: false,
      default: undefined,
    },
  },
  { timestamps: true, versionKey: false },
);

UniversitySchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function () {
    return deleteUniversityRelatedData(this);
  },
);

UniversitySchema.pre(
  'deleteOne',
  { document: false, query: true },
  async function () {
    const foundUniversity = await this.model
      .findOne(this.getQuery())
      .select({ logo: 1 })
      .exec();

    return deleteUniversityRelatedData(foundUniversity);
  },
);

UniversitySchema.pre('findOneAndDelete', async function () {
  const foundUniversity = await this.model
    .findOne(this.getQuery())
    .select({ logo: 1 })
    .exec();

  return deleteUniversityRelatedData(foundUniversity);
});

const UniversityModel = mongoose.model(
  COLLECTION_NAMES.UNIVERSITY,
  UniversitySchema,
);
export default UniversityModel;
