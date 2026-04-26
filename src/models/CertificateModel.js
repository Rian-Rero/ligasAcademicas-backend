import mongoose from 'mongoose';

import { COLLECTION_NAMES } from '../utils/general/constants.js';
import { ObjectId } from '../config/mongo.js';

const CertificateSchema = new mongoose.Schema({
  leagueMembership: {
    type: ObjectId,
    ref: COLLECTION_NAMES.LEAGUE_MEMBERSHIP,
    required: true,
  },
  workLoadHours: {
    type: Number,
    required: true,
    trim: true,
  },
  issueDate: {
    type: Date,
    required: true,
  },
  pdfUrl: {
    type: String,
    required: true,
    trim: true,
  },
});

const CertificateModel = mongoose.model(
  COLLECTION_NAMES.CERTIFICATE,
  CertificateSchema,
);
export default CertificateModel;
