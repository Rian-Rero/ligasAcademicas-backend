import mongoose from 'mongoose';

import { COLLECTION_NAMES } from '../utils/general/constants.js';
const { ObjectId } = mongoose.Schema.Types;

const SquadSchema = new mongoose.Schema({
  academicLeague: {
    type: ObjectId,
    ref: COLLECTION_NAMES.ACADEMIC_LEAGUE,
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
  function: {
    type: String,
    required: false,
    trim: true,
  },
});

const SquadModel = mongoose.model(COLLECTION_NAMES.SQUAD, SquadSchema);
export default SquadModel;
