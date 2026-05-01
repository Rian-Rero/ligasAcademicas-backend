import mongoose from 'mongoose';

import { COLLECTION_NAMES } from '../utils/general/constants.js';
const { ObjectId } = mongoose.Schema.Types;

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
