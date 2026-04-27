import * as EmailHandler from '../mail/handlers.js';
import * as UserService from '../services/UserService.js';
import asyncHandler from '../utils/general/asyncHandler.js';
import { SUCCESS_CODES } from '../utils/general/constants.js';
import {
  decodeConfirmEmailToken,
  signConfirmEmailJwt,
} from '../utils/libs/jwt.js';
import { generateTemporaryPassword } from '../utils/libs/randomPassword.js';
import * as UserValidator from '../validators/UserValidator.js';

export const get = asyncHandler(async (req, res) => {
  const inputFilters = UserValidator.get(req);
  const users = await UserService.get(inputFilters);

  res.status(SUCCESS_CODES.OK).json(users);
});

export const getById = asyncHandler(async (req, res) => {
  const { _id } = UserValidator.getById(req);
  const user = await UserService.getById(_id);

  res.status(SUCCESS_CODES.OK).json(user);
});

export const create = asyncHandler(async (req, res) => {
  const inputData = UserValidator.create(req);
  const temporaryPassword = generateTemporaryPassword();

  const newUser = await UserService.create({
    ...inputData,
    password: temporaryPassword,
  });

  const token = signConfirmEmailJwt(newUser._id);
  try {
    await EmailHandler.confirmEmail({
      user: newUser,
      token,
      temporaryPassword,
    });
  } catch (error) {
    await UserService.destroy(newUser._id);
    throw error;
  }

  res.status(SUCCESS_CODES.CREATED).json(newUser);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = UserValidator.verifyEmail(req);
  const { userId } = await decodeConfirmEmailToken(token);

  const updatedUser = await UserService.update({
    _id: userId,
    inputData: { emailVerified: true },
  });

  res.status(SUCCESS_CODES.OK).json(updatedUser.name);
});

export const update = asyncHandler(async (req, res) => {
  const { _id, ...inputData } = UserValidator.update(req);
  const updatedUser = await UserService.update({ _id, inputData });

  res.status(SUCCESS_CODES.OK).json(updatedUser);
});

export const updateByManagement = asyncHandler(async (req, res) => {
  const { _id, ...inputData } = UserValidator.updateByManagement(req);
  const updatedUser = await UserService.update({ _id, inputData });

  res.status(SUCCESS_CODES.OK).json(updatedUser);
});

export const resetPasswordByManagement = asyncHandler(async (req, res) => {
  const { _id } = UserValidator.resetPasswordByManagement(req);
  const temporaryPassword = generateTemporaryPassword();

  const updatedUser = await UserService.update({
    _id,
    inputData: { password: temporaryPassword },
  });

  await EmailHandler.managementPasswordResetEmail({
    user: updatedUser,
    temporaryPassword,
  });

  res.status(SUCCESS_CODES.OK).json({
    _id: updatedUser._id,
    email: updatedUser.email,
    name: updatedUser.name,
  });
});

export const destroy = asyncHandler(async (req, res) => {
  const { _id } = UserValidator.destroy(req);
  await UserService.destroy(_id);

  res.sendStatus(SUCCESS_CODES.NO_CONTENT);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = UserValidator.forgotPassword(req);

  const { foundUser, passwordToken } = await UserService.forgotPassword(email);
  await EmailHandler.redefinePasswordEmail({
    user: foundUser,
    passwordToken,
  });

  res.sendStatus(SUCCESS_CODES.OK);
});

export const redefinePassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = UserValidator.redefinePassword(req);
  const updatedUser = await UserService.redefinePassword({
    token,
    newPassword,
  });

  res.status(SUCCESS_CODES.OK).json(updatedUser.name);
});
