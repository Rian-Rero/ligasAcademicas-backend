import mongoose from 'mongoose';

import { ObjectId } from '../config/mongo.js';
import { COLLECTION_NAMES } from '../utils/general/constants.js';

const UserTokenSchema = new mongoose.Schema(
  {
    user: {
      type: ObjectId,
      ref: COLLECTION_NAMES.USER,
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0, // The document will expires at expiresAt + 0 seconds. Check https://mongoosejs.com/docs/api/schemadateoptions.html#SchemaDateOptions.prototype.expires
    },
  },
  { versionKey: false },
);

// Populate users before find calls
UserTokenSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
  });
  next();
});

const UserSessionTokenModel = mongoose.model(
  COLLECTION_NAMES.USER_SESSION_TOKEN,
  UserTokenSchema,
);
export default UserSessionTokenModel;
