import mongoose from 'mongoose';

import { COLLECTION_NAMES } from '../utils/general/constants.js';
import { ObjectId } from '../config/mongo.js';

const EventSchema = new mongoose.Schema({
  academicLeague: {
    type: ObjectId,
    ref: COLLECTION_NAMES.ACADEMIC_LEAGUE,
    required: true,
  },
  squad: {
    type: ObjectId,
    ref: COLLECTION_NAMES.SQUAD,
    required: false,
    default: null,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  dateTime: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
});

const EventModel = mongoose.model(COLLECTION_NAMES.EVENT, EventSchema);
export default EventModel;
