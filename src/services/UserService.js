import {
  ForbiddenError,
  NotFoundError,
  BadRequest,
} from '../errors/baseErrors.js';
import UserModel from '../models/UserModel.js';
import UserPwdTokenModel from '../models/UserPwdTokenModel.js';
import * as UserPermissionService from './UserPermissionService.js';
import {
  decodeForgotPasswordToken,
  signForgotPasswordJwt,
} from '../utils/libs/jwt.js';
import { comparePasswords } from '../utils/libs/bcrypt.js';
import { cloudinaryFileSchema } from '../utils/libs/zod/cloudinaryFileSchemas.js';
import cloudinary from '../utils/libs/cloudinary/index.js';

function sanitizeGoogleTokens(userLike) {
  const user =
    typeof userLike?.toObject === 'function' ? userLike.toObject() : userLike;
  if (!user) return user;

  const sanitized = { ...user };
  delete sanitized.googleCalendarAccessToken;
  delete sanitized.googleCalendarRefreshToken;
  delete sanitized.googleCalendarTokenExpiryDate;
  delete sanitized.googleCalendarScope;

  return sanitized;
}

async function attachRoleKeys(userLike) {
  if (!userLike) return userLike;

  const user =
    typeof userLike.toObject === 'function' ? userLike.toObject() : userLike;
  const roleKeys = await UserPermissionService.getUserRoleKeys(user._id);

  return {
    ...user,
    roleKeys,
  };
}

export async function get(inputFilters) {
  const users = await UserModel.find(inputFilters).lean().exec();

  return Promise.all(users.map((user) => attachRoleKeys(user)));
}

export async function getById(_id) {
  const foundUser = await UserModel.findById(_id).lean().exec();
  if (!foundUser) throw new NotFoundError('User not found');

  return attachRoleKeys(foundUser);
}

export async function getByIdWithGoogleTokens(_id) {
  const foundUser = await UserModel.findById(_id)
    .select(
      '+googleCalendarAccessToken +googleCalendarRefreshToken +googleCalendarTokenExpiryDate +googleCalendarScope',
    )
    .exec();

  if (!foundUser) throw new NotFoundError('User not found');

  return foundUser;
}

export async function create(inputData) {
  const newUser = (await UserModel.create(inputData)).toObject();
  delete newUser.password;

  return newUser;
}

export async function update({ _id, inputData }) {
  const foundUser = await UserModel.findById(_id).exec();
  if (!foundUser) throw new NotFoundError('User not found');

  return foundUser.set(inputData).save();
}

export async function uploadProfilePhoto({ _id, file }) {
  const foundUser = await UserModel.findById(_id).exec();
  if (!foundUser) throw new NotFoundError('User not found');

  const previousImageKey = foundUser.image?.key;
  const extension = file.mimetype?.split('/')[1] || 'jpg';
  const publicId = `users/profile/${_id}`;

  const { key, url } = await cloudinary.uploadFile({
    fileBuffer: file.buffer,
    fileName: `${_id}.${extension}`,
    publicId,
    resourceType: 'image',
  });
  const uploadedImage = cloudinaryFileSchema.parse({ key, url });

  try {
    const updatedUser = await foundUser.set({ image: uploadedImage }).save();

    if (previousImageKey && previousImageKey !== uploadedImage.key) {
      await cloudinary.deleteFile(previousImageKey);
    }

    return updatedUser;
  } catch (error) {
    await cloudinary.deleteFile(key);
    throw error;
  }
}

export async function linkGoogleCalendar({ _id, googleEmail, tokenData }) {
  const foundUser = await getByIdWithGoogleTokens(_id);

  const updatedUser = await foundUser
    .set({
      googleCalendarLinked: true,
      googleCalendarEmail: googleEmail,
      googleCalendarLinkedAt: new Date(),
      googleCalendarAccessToken:
        tokenData.accessToken || foundUser.googleCalendarAccessToken,
      googleCalendarRefreshToken:
        tokenData.refreshToken || foundUser.googleCalendarRefreshToken,
      googleCalendarTokenExpiryDate: tokenData.tokenExpiryDate,
      googleCalendarScope: tokenData.scope,
    })
    .save();

  return sanitizeGoogleTokens(updatedUser);
}

export async function unlinkGoogleCalendar(_id) {
  const foundUser = await getByIdWithGoogleTokens(_id);

  const updatedUser = await foundUser
    .set({
      googleCalendarLinked: false,
      googleCalendarEmail: null,
      googleCalendarLinkedAt: null,
      googleCalendarAccessToken: null,
      googleCalendarRefreshToken: null,
      googleCalendarTokenExpiryDate: null,
      googleCalendarScope: null,
    })
    .save();

  return sanitizeGoogleTokens(updatedUser);
}

export async function updateGoogleCalendarTokens(_id, tokenData) {
  const foundUser = await getByIdWithGoogleTokens(_id);

  const nextAccessToken =
    tokenData.accessToken || foundUser.googleCalendarAccessToken;
  const nextRefreshToken =
    tokenData.refreshToken || foundUser.googleCalendarRefreshToken;

  return foundUser
    .set({
      googleCalendarAccessToken: nextAccessToken,
      googleCalendarRefreshToken: nextRefreshToken,
      googleCalendarTokenExpiryDate:
        tokenData.tokenExpiryDate || foundUser.googleCalendarTokenExpiryDate,
      googleCalendarScope: tokenData.scope || foundUser.googleCalendarScope,
    })
    .save();
}

export async function destroy(_id) {
  const foundUser = await UserModel.findById(_id).exec();
  if (!foundUser) throw new NotFoundError('User not found');

  await foundUser.deleteOne();
}

export async function forgotPassword(email) {
  const foundUser = await UserModel.findOne({
    email,
  })
    .lean()
    .exec();
  if (!foundUser) throw new NotFoundError('User not found');

  // Generate JWT token for password reset
  const passwordToken = signForgotPasswordJwt(foundUser._id);

  // Clear previous tokens and create new one (single-use, with expiration)
  await UserPwdTokenModel.deleteMany({ user: foundUser._id }).exec();
  await UserPwdTokenModel.create({
    user: foundUser._id,
    token: passwordToken,
  });

  return { foundUser, passwordToken };
}

export async function redefinePassword({ token, newPassword }) {
  const { userId } = await decodeForgotPasswordToken(token);

  const [foundUser, foundToken] = await Promise.all([
    UserModel.findById(userId).exec(),
    UserPwdTokenModel.findOne({ token }).exec(),
  ]);

  if (!foundUser) throw new NotFoundError('User not found');
  if (!foundToken) throw new ForbiddenError('Token expired or not found');
  if (userId !== foundToken.user.toString())
    throw new ForbiddenError('Tampered token');

  await foundToken.deleteOne(); // The user password can only be updated one time with the same token

  // Reset mustChangePassword flag when a password is redefined through the forgot-password flow
  return foundUser
    .set({ password: newPassword, mustChangePassword: false })
    .save();
}

export async function changePassword({ _id, newPassword, currentPassword }) {
  const foundUser = await UserModel.findById(_id).select('+password').exec();
  if (!foundUser) throw new NotFoundError('User not found');

  // If user is not in forced-change mode, require currentPassword and verify it
  if (!foundUser.mustChangePassword) {
    if (!currentPassword) throw new BadRequest('Current password is required');

    const isMatch = await comparePasswords(currentPassword, foundUser.password);
    if (!isMatch) throw new ForbiddenError('Current password incorrect');
  }

  // Update password and clear mustChangePassword flag
  return foundUser
    .set({ password: newPassword, mustChangePassword: false })
    .save();
}
