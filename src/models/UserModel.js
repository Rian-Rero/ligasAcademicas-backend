import mongoose from 'mongoose';

import { COLLECTION_NAMES } from '../utils/general/constants.js';
import cloudinary from '../utils/libs/cloudinary/index.js';
import { hashPassword } from '../utils/libs/bcrypt.js';
import CloudinaryFileSchema from '../utils/libs/mongoose/subdocuments/CloudinaryFileSchema.js';
import UserSessionTokenModel from './UserSessionTokenModel.js';

async function deleteUserSessionTokens(userId) {
  if (!userId) return null;

  return UserSessionTokenModel.deleteMany({ user: userId }).exec();
}

async function deleteUserProfileImage(user) {
  if (!user) return null;

  if (user.image?.key) {
    return cloudinary.deleteFile(user.image.key);
  }

  if (!user.imageURL) return null;

  return cloudinary.deleteFileByUrl(user.imageURL);
}

async function deleteUserRelatedData(user) {
  if (!user?._id) return null;

  return Promise.all([
    deleteUserSessionTokens(user._id),
    deleteUserProfileImage(user),
  ]);
}

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
    image: {
      type: CloudinaryFileSchema,
      required: false,
      default: undefined,
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
    return deleteUserRelatedData(this);
  },
);

UserSchema.pre(
  'deleteOne',
  { document: false, query: true },
  async function () {
    const foundUser = await this.model
      .findOne(this.getQuery())
      .select({ imageURL: 1, image: 1 })
      .exec();

    return deleteUserRelatedData(foundUser);
  },
);

UserSchema.pre('findOneAndDelete', async function () {
  const foundUser = await this.model
    .findOne(this.getQuery())
    .select({ imageURL: 1, image: 1 })
    .exec();

  return deleteUserRelatedData(foundUser);
});

const UserModel = mongoose.model(COLLECTION_NAMES.USER, UserSchema);
export default UserModel;
