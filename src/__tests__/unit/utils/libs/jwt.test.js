import { describe, expect, it } from 'vitest';

import {
  decodeAccessToken,
  decodeConfirmEmailToken,
  decodeForgotPasswordToken,
  decodeRefreshToken,
  signConfirmEmailJwt,
  signForgotPasswordJwt,
  signSessionJwts,
} from '../../../../utils/libs/jwt.js';

const testUser = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test',
  email: 'test@sgla.com',
  roleKeys: [],
};

describe('signSessionJwts', () => {
  it('returns an accessToken and a refreshToken', () => {
    const { accessToken, refreshToken } = signSessionJwts(testUser);
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');
  });
});

describe('decodeAccessToken', () => {
  it('resolves with the user payload for a valid token', async () => {
    const { accessToken } = signSessionJwts(testUser);
    const decoded = await decodeAccessToken(accessToken);
    expect(decoded).toHaveProperty('user');
    expect(decoded.user._id).toBe(testUser._id);
  });

  it('rejects with an error for an invalid token', async () => {
    await expect(decodeAccessToken('invalid.token.here')).rejects.toThrow();
  });
});

describe('decodeRefreshToken', () => {
  it('resolves with userId for a valid token', async () => {
    const { refreshToken } = signSessionJwts(testUser);
    const decoded = await decodeRefreshToken(refreshToken);
    expect(decoded).toHaveProperty('userId', testUser._id);
  });

  it('rejects with an error for an invalid token', async () => {
    await expect(decodeRefreshToken('bad.refresh.token')).rejects.toThrow();
  });
});

describe('signConfirmEmailJwt / decodeConfirmEmailToken', () => {
  it('produces a decodable email token with userId', async () => {
    const token = signConfirmEmailJwt('507f1f77bcf86cd799439011');
    const decoded = await decodeConfirmEmailToken(token);
    expect(decoded).toHaveProperty('userId', '507f1f77bcf86cd799439011');
  });

  it('decodeConfirmEmailToken rejects for an invalid token', async () => {
    await expect(decodeConfirmEmailToken('bad')).rejects.toThrow();
  });
});

describe('signForgotPasswordJwt / decodeForgotPasswordToken', () => {
  it('produces a decodable password-reset token with userId', async () => {
    const token = signForgotPasswordJwt('507f1f77bcf86cd799439022');
    const decoded = await decodeForgotPasswordToken(token);
    expect(decoded).toHaveProperty('userId', '507f1f77bcf86cd799439022');
  });

  it('decodeForgotPasswordToken rejects for an invalid token', async () => {
    await expect(decodeForgotPasswordToken('bad')).rejects.toThrow();
  });
});
