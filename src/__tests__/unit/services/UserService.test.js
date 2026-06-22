import { describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

import {
  NotFoundError,
  ForbiddenError,
  BadRequest,
} from '../../../errors/baseErrors.js';
import * as UserService from '../../../services/UserService.js';
import UserModel from '../../../models/UserModel.js';
import UserPwdTokenModel from '../../../models/UserPwdTokenModel.js';
import RoleModel from '../../../models/RoleModel.js';
import { signForgotPasswordJwt } from '../../../utils/libs/jwt.js';
import { createUser, createRole } from '../../helpers/factories.js';

vi.mock('../../../utils/libs/cloudinary/index.js', () => ({
  default: {
    uploadFile: vi
      .fn()
      .mockResolvedValue({
        url: 'https://cdn.test/photo.jpg',
        key: 'users/profile/123',
      }),
    deleteFile: vi.fn().mockResolvedValue(true),
  },
}));

// ---------------------------------------------------------------------------
// UserService.get
// ---------------------------------------------------------------------------

describe('UserService.get', () => {
  it('returns an empty array when no users exist', async () => {
    const result = await UserService.get({});
    expect(result).toEqual([]);
  });

  it('returns all users with roleKeys attached', async () => {
    await createUser();
    await createUser();

    const result = await UserService.get({});

    expect(result).toHaveLength(2);
    result.forEach((u) => {
      expect(u).toHaveProperty('roleKeys');
      expect(Array.isArray(u.roleKeys)).toBe(true);
    });
  });

  it('filters results by the provided inputFilters', async () => {
    const target = await createUser({
      name: 'Filtered User',
      email: 'filtered@sgla-test.com',
    });
    await createUser();

    const result = await UserService.get({ _id: target._id });

    expect(result).toHaveLength(1);
    expect(result[0]._id.toString()).toBe(target._id.toString());
  });
});

// ---------------------------------------------------------------------------
// UserService.getById
// ---------------------------------------------------------------------------

describe('UserService.getById', () => {
  it('returns the user with roleKeys for a valid id', async () => {
    const user = await createUser();

    const result = await UserService.getById(user._id.toString());

    expect(result._id.toString()).toBe(user._id.toString());
    expect(result).toHaveProperty('roleKeys');
    expect(Array.isArray(result.roleKeys)).toBe(true);
  });

  it('throws NotFoundError for a non-existent id', async () => {
    await expect(
      UserService.getById('507f1f77bcf86cd799439011'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

// ---------------------------------------------------------------------------
// UserService.create
// ---------------------------------------------------------------------------

describe('UserService.create', () => {
  it('creates a user and returns without the password field', async () => {
    const result = await UserService.create({
      name: 'New User',
      email: 'new@sgla-test.com',
      password: 'Password@1',
    });

    expect(result).toBeDefined();
    expect(result.email).toBe('new@sgla-test.com');
    expect(result.password).toBeUndefined();
  });

  it('assigns the member role when a member role exists', async () => {
    const memberRole = await createRole({ key: 'member' });

    const result = await UserService.create({
      name: 'Member User',
      email: 'member@sgla-test.com',
      password: 'Password@1',
    });

    const withRoles = await UserService.getById(result._id.toString());
    expect(withRoles.roleKeys).toContain('member');

    // clean up to avoid cross-test contamination with unique key
    await RoleModel.findByIdAndDelete(memberRole._id);
  });

  it('creates a user without assigning any role when member role does not exist', async () => {
    const result = await UserService.create({
      name: 'No Role User',
      email: 'norole@sgla-test.com',
      password: 'Password@1',
    });

    const withRoles = await UserService.getById(result._id.toString());
    expect(withRoles.roleKeys).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// UserService.update
// ---------------------------------------------------------------------------

describe('UserService.update', () => {
  it('updates user fields and returns the updated document', async () => {
    const user = await createUser();

    const result = await UserService.update({
      _id: user._id.toString(),
      inputData: { name: 'Updated Name' },
    });

    expect(result.name).toBe('Updated Name');
  });

  it('throws NotFoundError when the user does not exist', async () => {
    await expect(
      UserService.update({
        _id: '507f1f77bcf86cd799439011',
        inputData: { name: 'Ghost' },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

// ---------------------------------------------------------------------------
// UserService.destroy
// ---------------------------------------------------------------------------

describe('UserService.destroy', () => {
  it('removes the user document from the database', async () => {
    const user = await createUser();

    await UserService.destroy(user._id.toString());

    const found = await UserModel.findById(user._id).exec();
    expect(found).toBeNull();
  });

  it('throws NotFoundError when the user does not exist', async () => {
    await expect(
      UserService.destroy('507f1f77bcf86cd799439011'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

// ---------------------------------------------------------------------------
// UserService.forgotPassword
// ---------------------------------------------------------------------------

describe('UserService.forgotPassword', () => {
  it('creates a password reset token for a valid email', async () => {
    const user = await createUser({ email: 'forgot@sgla-test.com' });

    const { foundUser, passwordToken } = await UserService.forgotPassword(
      'forgot@sgla-test.com',
    );

    expect(foundUser._id.toString()).toBe(user._id.toString());
    expect(typeof passwordToken).toBe('string');
    expect(passwordToken.length).toBeGreaterThan(0);

    const stored = await UserPwdTokenModel.findOne({ user: user._id }).exec();
    expect(stored).not.toBeNull();
    expect(stored.token).toBe(passwordToken);
  });

  it('throws NotFoundError for a non-existent email', async () => {
    await expect(
      UserService.forgotPassword('nobody@sgla-test.com'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('clears any previous tokens before creating the new one', async () => {
    const user = await createUser({ email: 'cleartoken@sgla-test.com' });

    // Create a stale token manually
    const staleToken = signForgotPasswordJwt(user._id.toString());
    await UserPwdTokenModel.create({ user: user._id, token: staleToken });

    await UserService.forgotPassword('cleartoken@sgla-test.com');

    const tokens = await UserPwdTokenModel.find({ user: user._id }).exec();
    expect(tokens).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// UserService.redefinePassword
// ---------------------------------------------------------------------------

describe('UserService.redefinePassword', () => {
  it('updates the password and clears mustChangePassword when token is valid', async () => {
    const user = await createUser({ email: 'redefine@sgla-test.com' });
    const { passwordToken } = await UserService.forgotPassword(
      'redefine@sgla-test.com',
    );

    const updated = await UserService.redefinePassword({
      token: passwordToken,
      newPassword: 'NewPassword@2',
    });

    expect(updated.mustChangePassword).toBe(false);

    // Token must be consumed (single-use)
    const consumed = await UserPwdTokenModel.findOne({ user: user._id }).exec();
    expect(consumed).toBeNull();
  });

  it('throws ForbiddenError when the token has expired', async () => {
    // Sign a token that expires immediately (1 second in the past via iat manipulation is
    // tricky; instead sign with expiresIn:1 and use a known-expired token string signed
    // with the test secret and expired epoch).
    const expiredToken = jwt.sign(
      { userId: '507f1f77bcf86cd799439011' },
      process.env.PASSWORD_TOKEN_SECRET,
      { expiresIn: -1 },
    );

    await expect(
      UserService.redefinePassword({
        token: expiredToken,
        newPassword: 'Any@1',
      }),
    ).rejects.toThrow();
  });

  it('throws ForbiddenError when the token does not match any stored record', async () => {
    const user = await createUser({ email: 'tampered@sgla-test.com' });

    // Generate a valid token but do NOT store it (simulates a tampered / never-issued token)
    const orphanToken = signForgotPasswordJwt(user._id.toString());

    await expect(
      UserService.redefinePassword({
        token: orphanToken,
        newPassword: 'Any@1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws ForbiddenError when the token userId does not match the stored token user', async () => {
    const userA = await createUser({ email: 'usera@sgla-test.com' });
    const userB = await createUser({ email: 'userb@sgla-test.com' });

    // Store a token referencing userB but sign it with userA's id
    const tamperedToken = signForgotPasswordJwt(userA._id.toString());
    await UserPwdTokenModel.create({ user: userB._id, token: tamperedToken });

    await expect(
      UserService.redefinePassword({
        token: tamperedToken,
        newPassword: 'Any@1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

// ---------------------------------------------------------------------------
// UserService.changePassword
// ---------------------------------------------------------------------------

describe('UserService.changePassword', () => {
  it('updates the password when currentPassword is correct', async () => {
    const rawPassword = 'Password@1';
    const user = await createUser({
      email: 'change@sgla-test.com',
      password: rawPassword,
    });

    const updated = await UserService.changePassword({
      _id: user._id.toString(),
      newPassword: 'NewPassword@2',
      currentPassword: rawPassword,
    });

    expect(updated.mustChangePassword).toBe(false);
  });

  it('throws ForbiddenError when currentPassword is wrong', async () => {
    const user = await createUser({
      email: 'wrongpwd@sgla-test.com',
      password: 'Password@1',
    });

    await expect(
      UserService.changePassword({
        _id: user._id.toString(),
        newPassword: 'NewPassword@2',
        currentPassword: 'WrongPassword@9',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws BadRequest when currentPassword is missing and mustChangePassword is false', async () => {
    const user = await createUser({
      email: 'nopwd@sgla-test.com',
      mustChangePassword: false,
    });

    await expect(
      UserService.changePassword({
        _id: user._id.toString(),
        newPassword: 'NewPassword@2',
      }),
    ).rejects.toBeInstanceOf(BadRequest);
  });

  it('allows password change without currentPassword when mustChangePassword is true', async () => {
    const user = await createUser({
      email: 'mustchange@sgla-test.com',
      password: 'Password@1',
      mustChangePassword: true,
    });

    const updated = await UserService.changePassword({
      _id: user._id.toString(),
      newPassword: 'ForcedNew@2',
    });

    expect(updated.mustChangePassword).toBe(false);
  });

  it('throws NotFoundError for a non-existent user', async () => {
    await expect(
      UserService.changePassword({
        _id: '507f1f77bcf86cd799439011',
        newPassword: 'Any@1',
        currentPassword: 'Any@1',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

// ---------------------------------------------------------------------------
// UserService.uploadProfilePhoto
// ---------------------------------------------------------------------------

describe('UserService.uploadProfilePhoto', () => {
  it('uploads a photo and updates the user image field', async () => {
    const user = await createUser({ email: 'photo@sgla-test.com' });
    const fakeFile = {
      buffer: Buffer.from('fake-image-data'),
      mimetype: 'image/jpeg',
    };

    const updated = await UserService.uploadProfilePhoto({
      _id: user._id.toString(),
      file: fakeFile,
    });

    expect(updated.image).toBeDefined();
    expect(updated.image.url).toBe('https://cdn.test/photo.jpg');
  });

  it('throws NotFoundError when the user does not exist', async () => {
    const fakeFile = { buffer: Buffer.from('data'), mimetype: 'image/png' };

    await expect(
      UserService.uploadProfilePhoto({
        _id: '507f1f77bcf86cd799439011',
        file: fakeFile,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

// ---------------------------------------------------------------------------
// UserService.linkGoogleCalendar
// ---------------------------------------------------------------------------

describe('UserService.linkGoogleCalendar', () => {
  it('sets googleCalendarLinked and stores the email', async () => {
    const user = await createUser({ email: 'gcal@sgla-test.com' });

    const result = await UserService.linkGoogleCalendar({
      _id: user._id.toString(),
      googleEmail: 'gcal@gmail.com',
      tokenData: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenExpiryDate: new Date(Date.now() + 3600_000),
        scope: 'https://www.googleapis.com/auth/calendar',
      },
    });

    expect(result.googleCalendarLinked).toBe(true);
    expect(result.googleCalendarEmail).toBe('gcal@gmail.com');
  });

  it('does not expose google tokens in the returned object', async () => {
    const user = await createUser({ email: 'gcalhide@sgla-test.com' });

    const result = await UserService.linkGoogleCalendar({
      _id: user._id.toString(),
      googleEmail: 'gcalhide@gmail.com',
      tokenData: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenExpiryDate: new Date(Date.now() + 3600_000),
        scope: 'https://www.googleapis.com/auth/calendar',
      },
    });

    expect(result.googleCalendarAccessToken).toBeUndefined();
    expect(result.googleCalendarRefreshToken).toBeUndefined();
  });

  it('throws NotFoundError when the user does not exist', async () => {
    await expect(
      UserService.linkGoogleCalendar({
        _id: '507f1f77bcf86cd799439011',
        googleEmail: 'x@gmail.com',
        tokenData: {
          accessToken: 'a',
          refreshToken: 'r',
          tokenExpiryDate: new Date(),
          scope: 's',
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

// ---------------------------------------------------------------------------
// UserService.unlinkGoogleCalendar
// ---------------------------------------------------------------------------

describe('UserService.unlinkGoogleCalendar', () => {
  it('clears all Google Calendar fields and sets linked to false', async () => {
    const user = await createUser({ email: 'unlink@sgla-test.com' });

    // First link
    await UserService.linkGoogleCalendar({
      _id: user._id.toString(),
      googleEmail: 'unlink@gmail.com',
      tokenData: {
        accessToken: 'at',
        refreshToken: 'rt',
        tokenExpiryDate: new Date(Date.now() + 3600_000),
        scope: 'scope',
      },
    });

    const result = await UserService.unlinkGoogleCalendar(user._id.toString());

    expect(result.googleCalendarLinked).toBe(false);
    expect(result.googleCalendarEmail).toBeNull();
    expect(result.googleCalendarLinkedAt).toBeNull();
  });

  it('does not expose google tokens in the returned object after unlink', async () => {
    const user = await createUser({ email: 'unlinkhide@sgla-test.com' });

    await UserService.linkGoogleCalendar({
      _id: user._id.toString(),
      googleEmail: 'unlinkhide@gmail.com',
      tokenData: {
        accessToken: 'at',
        refreshToken: 'rt',
        tokenExpiryDate: new Date(Date.now() + 3600_000),
        scope: 'scope',
      },
    });

    const result = await UserService.unlinkGoogleCalendar(user._id.toString());

    expect(result.googleCalendarAccessToken).toBeUndefined();
    expect(result.googleCalendarRefreshToken).toBeUndefined();
  });

  it('throws NotFoundError when the user does not exist', async () => {
    await expect(
      UserService.unlinkGoogleCalendar('507f1f77bcf86cd799439011'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
