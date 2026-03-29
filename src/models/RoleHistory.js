import mongoose from 'mongoose';

import { COLLECTION_NAMES } from '../utils/general/constants.js';
import { ObjectId } from '../config/mongo.js';

const RoleHistorySchema = new mongoose.Schema({
  leagueMembership: {
    type: ObjectId,
    ref: COLLECTION_NAMES.LEAGUE_MEMBERSHIP,
    required: true,
  },
  squad: {
    type: ObjectId,
    ref: COLLECTION_NAMES.SQUAD,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: false,
  },
});

const RoleHistoryModel = mongoose.model(
  COLLECTION_NAMES.ROLE_HISTORY,
  RoleHistorySchema,
);
export default RoleHistoryModel;
