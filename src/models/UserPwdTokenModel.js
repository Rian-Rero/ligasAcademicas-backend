import mongoose from 'mongoose';

import { ObjectId } from '../config/mongo.js';
import { COLLECTION_NAMES } from '../utils/general/constants.js';

const UserPwdTokenSchema = new mongoose.Schema(
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
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
      expires: 900, // The document will expires at createdAt + 900 seconds (15 minutes). Check https://mongoosejs.com/docs/api/schemadateoptions.html#SchemaDateOptions.prototype.expires
    },
  },
  { versionKey: false },
);

const UserPwdTokenModel = mongoose.model(
  COLLECTION_NAMES.USER_PWD_TOKEN,
  UserPwdTokenSchema,
);
export default UserPwdTokenModel;
