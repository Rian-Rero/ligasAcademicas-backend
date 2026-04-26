import mongoose from 'mongoose';

import { COLLECTION_NAMES } from '../utils/general/constants.js';
import { ObjectId } from '../config/mongo.js';

const AttendanceSchema = new mongoose.Schema({
  event: {
    type: ObjectId,
    ref: COLLECTION_NAMES.EVENT,
    required: true,
  },
  leagueMembership: {
    type: ObjectId,
    ref: COLLECTION_NAMES.LEAGUE_MEMBERSHIP,
    required: true,
  },
  isConfirmed: {
    type: Boolean,
    required: true,
    default: false,
  },
  hasAttended: {
    type: Boolean,
    required: true,
    default: false,
  },
});

AttendanceSchema.index({ event: 1, leagueMembership: 1 }, { unique: true });

const AttendanceModel = mongoose.model(
  COLLECTION_NAMES.ATTENDANCE,
  AttendanceSchema,
);
export default AttendanceModel;
