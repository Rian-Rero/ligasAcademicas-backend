import mongoose from 'mongoose';

import { COLLECTION_NAMES } from '../utils/general/constants.js';
const { ObjectId } = mongoose.Schema.Types;

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
  googleCalendarEventId: {
    type: String,
    required: false,
    default: null,
  },
  googleCalendarUserId: {
    type: ObjectId,
    ref: COLLECTION_NAMES.USER,
    required: false,
    default: null,
  },
});

const EventModel = mongoose.model(COLLECTION_NAMES.EVENT, EventSchema);
export default EventModel;
