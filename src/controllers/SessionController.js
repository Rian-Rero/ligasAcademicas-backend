import * as SessionService from '../services/SessionService.js';
import asyncHandler from '../utils/general/asyncHandler.js';
import { SUCCESS_CODES } from '../utils/general/constants.js';
import {
  cookieAuthName,
  createCookieOptions,
  deleteCookieOptions,
} from '../utils/general/cookieAuth.js';
import * as SessionValidator from '../validators/SessionValidator.js';

export const handleLogin = asyncHandler(async (req, res) => {
  const inputData = SessionValidator.login(req);
  const { accessToken, refreshToken } =
    await SessionService.processLogin(inputData);

  // Creates secure Cookie with refresh token and sends access token to the user
  res
    .cookie(cookieAuthName, refreshToken, createCookieOptions)
    .status(SUCCESS_CODES.OK)
    .json({ accessToken });
});

export const handleRefreshToken = asyncHandler(async (req, res) => {
  const { token } = SessionValidator.refresh(req);

  // Deletes any cookie with a name that matches the authentication one
  res.clearCookie(cookieAuthName, deleteCookieOptions);

  const { accessToken, refreshToken } =
    await SessionService.processRefreshToken(token);

  // Creates secure Cookie with refresh token and sends access token to the user
  res
    .cookie(cookieAuthName, refreshToken, createCookieOptions)
    .status(SUCCESS_CODES.OK)
    .json({ accessToken });
});

export const handleLogout = asyncHandler(async (req, res) => {
  const { token } = SessionValidator.refresh(req);
  if (!token) return res.sendStatus(SUCCESS_CODES.NO_CONTENT); // No content

  // Delete refresh token if exists in db
  await SessionService.deleteUserToken(token);

  return res
    .clearCookie(cookieAuthName, deleteCookieOptions)
    .sendStatus(SUCCESS_CODES.NO_CONTENT);
});
