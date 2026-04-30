import mongoose from 'mongoose';

import { COLLECTION_NAMES } from '../utils/general/constants.js';
import { hashPassword } from '../utils/libs/bcrypt.js';
import UserSessionTokenModel from './UserSessionTokenModel.js';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false,
      select: false,
    },
    imageURL: {
      type: String,
      required: false,
    },
    globalRole: {
      type: String,
      required: false,
      default: 'league-member',
    },
    emailVerified: {
      type: Boolean,
      required: false,
      default: false,
    },
    mustChangePassword: {
      type: Boolean,
      required: false,
      default: false,
    },
    googleCalendarLinked: {
      type: Boolean,
      required: false,
      default: false,
    },
    googleCalendarEmail: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      default: null,
    },
    googleCalendarLinkedAt: {
      type: Date,
      required: false,
      default: null,
    },
    googleCalendarAccessToken: {
      type: String,
      required: false,
      default: null,
      select: false,
    },
    googleCalendarRefreshToken: {
      type: String,
      required: false,
      default: null,
      select: false,
    },
    googleCalendarTokenExpiryDate: {
      type: Date,
      required: false,
      default: null,
      select: false,
    },
    googleCalendarScope: {
      type: String,
      required: false,
      default: null,
      select: false,
    },
  },
  { timestamps: true, versionKey: false },
);

UserSchema.pre('save', async function () {
  // only hash the password if it has been modified or it is new
  if (this.isModified('password')) {
    this.password = await hashPassword(this.password);
  }
});

UserSchema.pre(
  'deleteOne',
  { document: true, query: false }, // More details on https://mongoosejs.com/docs/api/schema.html#schema_Schema-pre
  async function () {
    return Promise.all([
      UserSessionTokenModel.deleteMany({ user: this._id }).exec(),
    ]);
  },
);

const UserModel = mongoose.model(COLLECTION_NAMES.USER, UserSchema);
export default UserModel;
