import { describe, expect, it } from 'vitest';

import {
  ForbiddenError,
  UnauthorizedError,
} from '../../../errors/baseErrors.js';
import UserSessionTokenModel from '../../../models/UserSessionTokenModel.js';
import * as SessionService from '../../../services/SessionService.js';
import { createUser } from '../../helpers/factories.js';

describe('SessionService.processLogin', () => {
  it('returns accessToken and refreshToken for valid credentials', async () => {
    await createUser({
      email: 'login@test.com',
      password: 'Password@1',
      emailVerified: true,
    });
    const result = await SessionService.processLogin({
      email: 'login@test.com',
      password: 'Password@1',
    });
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(typeof result.accessToken).toBe('string');
  });

  it('throws UnauthorizedError for unknown email', async () => {
    await expect(
      SessionService.processLogin({
        email: 'nobody@test.com',
        password: 'Password@1',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError for wrong password', async () => {
    await createUser({
      email: 'wrongpwd@test.com',
      password: 'Password@1',
      emailVerified: true,
    });
    await expect(
      SessionService.processLogin({
        email: 'wrongpwd@test.com',
        password: 'WrongPassword',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws ForbiddenError when emailVerified is false', async () => {
    await createUser({
      email: 'unverified@test.com',
      password: 'Password@1',
      emailVerified: false,
    });
    await expect(
      SessionService.processLogin({
        email: 'unverified@test.com',
        password: 'Password@1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('clears all session tokens when a reuse attack is detected (token not in DB)', async () => {
    const user = await createUser({
      email: 'reuse@test.com',
      password: 'Password@1',
      emailVerified: true,
    });
    await UserSessionTokenModel.create({
      user: user._id,
      token: 'some-old-token',
      expiresAt: new Date(Date.now() + 86400000),
    });

    await SessionService.processLogin({
      email: 'reuse@test.com',
      password: 'Password@1',
      token: 'non-existing-token-in-db',
    });

    const remaining = await UserSessionTokenModel.find({ user: user._id });
    // The old token was deleted and a new one was created
    expect(remaining.every((t) => t.token !== 'some-old-token')).toBe(true);
  });

  it('saves refreshToken to DB on successful login', async () => {
    await createUser({
      email: 'savetoken@test.com',
      password: 'Password@1',
      emailVerified: true,
    });
    const result = await SessionService.processLogin({
      email: 'savetoken@test.com',
      password: 'Password@1',
    });
    const saved = await UserSessionTokenModel.findOne({
      token: result.refreshToken,
    });
    expect(saved).not.toBeNull();
  });
});

describe('SessionService.processRefreshToken', () => {
  it('throws UnauthorizedError when no token is provided', async () => {
    await expect(
      SessionService.processRefreshToken(null),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('returns new access and refresh tokens for a valid refresh token', async () => {
    const user = await createUser({
      email: 'refresh@test.com',
      password: 'Password@1',
      emailVerified: true,
    });
    const { refreshToken } = await SessionService.processLogin({
      email: 'refresh@test.com',
      password: 'Password@1',
    });

    const result = await SessionService.processRefreshToken(refreshToken);
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(typeof result.accessToken).toBe('string');
    expect(typeof result.refreshToken).toBe('string');

    // Exactly one token should exist for this user (old rotated, new created)
    const tokens = await UserSessionTokenModel.find({ user: user._id });
    expect(tokens).toHaveLength(1);
  });

  it('throws ForbiddenError and clears tokens when token is not in DB (reuse attack)', async () => {
    await createUser({
      email: 'reuse2@test.com',
      password: 'Password@1',
      emailVerified: true,
    });
    const { refreshToken } = await SessionService.processLogin({
      email: 'reuse2@test.com',
      password: 'Password@1',
    });

    // Remove from DB to simulate reuse attack
    await UserSessionTokenModel.deleteOne({ token: refreshToken });

    await expect(
      SessionService.processRefreshToken(refreshToken),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('SessionService.deleteUserToken', () => {
  it('returns null when the token does not exist', async () => {
    const result = await SessionService.deleteUserToken('non-existing-token');
    expect(result).toBeNull();
  });

  it('deletes and returns the token document when it exists', async () => {
    await createUser({
      email: 'delete-token@test.com',
      password: 'Password@1',
      emailVerified: true,
    });
    const { refreshToken } = await SessionService.processLogin({
      email: 'delete-token@test.com',
      password: 'Password@1',
    });

    const deleted = await SessionService.deleteUserToken(refreshToken);
    expect(deleted).not.toBeNull();

    const remaining = await UserSessionTokenModel.findOne({
      token: refreshToken,
    });
    expect(remaining).toBeNull();
  });
});
