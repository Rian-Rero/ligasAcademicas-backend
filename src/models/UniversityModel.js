import mongoose from 'mongoose';

import { COLLECTION_NAMES } from '../utils/general/constants.js';

const UniversitySchema = new mongoose.Schema({
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
    trim: true,
  },
  complement: {
    type: String,
    required: false,
    trim: true,
  },
});

const UniversityModel = mongoose.model(
  COLLECTION_NAMES.UNIVERSITY,
  UniversitySchema,
);
export default UniversityModel;
