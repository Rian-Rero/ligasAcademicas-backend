import mongoose from 'mongoose';

import { COLLECTION_NAMES } from '../utils/general/constants.js';
import { ObjectId } from '../config/mongo.js';

const LeagueMembershipSchema = new mongoose.Schema({
  user: {
    type: ObjectId,
    ref: COLLECTION_NAMES.USER,
    required: true,
  },
  academicLeague: {
    type: ObjectId,
    ref: COLLECTION_NAMES.ACADEMIC_LEAGUE,
    required: true,
  },
  squad: {
    type: ObjectId,
    ref: COLLECTION_NAMES.SQUAD,
    required: true,
  },
  role: {
    type: String,
    required: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    required: true,
    trim: true,
  },
});

const LeagueMembershipModel = mongoose.model(
  COLLECTION_NAMES.LEAGUE_MEMBERSHIP,
  LeagueMembershipSchema,
);
export default LeagueMembershipModel;
