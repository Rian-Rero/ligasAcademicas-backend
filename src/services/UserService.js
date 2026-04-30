import {
  ForbiddenError,
  NotFoundError,
  BadRequest,
} from '../errors/baseErrors.js';
import UserModel from '../models/UserModel.js';
import UserPwdTokenModel from '../models/UserPwdTokenModel.js';
import {
  decodeForgotPasswordToken,
  signForgotPasswordJwt,
} from '../utils/libs/jwt.js';
import { comparePasswords } from '../utils/libs/bcrypt.js';

export async function get(inputFilters) {
  return UserModel.find(inputFilters).lean().exec();
}

export async function getById(_id) {
  const foundUser = await UserModel.findById(_id).lean().exec();
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
