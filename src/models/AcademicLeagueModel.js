import mongoose from 'mongoose';

import { COLLECTION_NAMES } from '../utils/general/constants.js';
const { ObjectId } = mongoose.Schema.Types;

const AcademicLeagueSchema = new mongoose.Schema({
  university: {
    type: ObjectId,
    ref: COLLECTION_NAMES.UNIVERSITY,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  area: {
    type: String,
    required: false,
    trim: true,
  },
});

const AcademicLeagueModel = mongoose.model(
  COLLECTION_NAMES.ACADEMIC_LEAGUE,
  AcademicLeagueSchema,
);
export default AcademicLeagueModel;
