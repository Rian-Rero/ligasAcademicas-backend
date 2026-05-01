import mongoose from 'mongoose';

import { COLLECTION_NAMES } from '../utils/general/constants.js';
const { ObjectId } = mongoose.Schema.Types;

const LeagueMembershipSchema = new mongoose.Schema({
  user: {
    type: ObjectId,
    ref: COLLECTION_NAMES.USER,
    required: true,
  },
  academicLeague: {
    type: ObjectId,
    ref: COLLECTION_NAMES.ACADEMIC_LEAGUE,
    required: false,
  },
  squad: {
    type: ObjectId,
    ref: COLLECTION_NAMES.SQUAD,
    required: false,
  },
  university: {
    type: ObjectId,
    ref: COLLECTION_NAMES.UNIVERSITY,
    required: false,
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
