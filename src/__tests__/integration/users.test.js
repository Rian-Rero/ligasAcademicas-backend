import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../mail/handlers.js', () => ({
  confirmEmail: vi.fn().mockResolvedValue(true),
  redefinePasswordEmail: vi.fn().mockResolvedValue(true),
  managementPasswordResetEmail: vi.fn().mockResolvedValue(true),
  taskDelegated: vi.fn().mockResolvedValue(true),
  taskCompleted: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../utils/libs/cloudinary/index.js', () => ({
  default: {
    uploadFile: vi
      .fn()
      .mockResolvedValue({ url: 'https://cdn.test/file', key: 'test-key' }),
    deleteFile: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../../services/GoogleCalendarService.js', () => ({
  getGoogleAuthorizationUrl: vi
    .fn()
    .mockReturnValue('https://accounts.google.com/o/oauth2/auth?mock=1'),
  resolveGoogleCallback: vi.fn().mockResolvedValue({
    userId: null,
    googleEmail: 'mock@gmail.com',
    tokenData: {},
  }),
}));

import app from '../../app.js';
import { createUser, createAdminUser } from '../helpers/factories.js';

async function getUserWithToken(overrides = {}) {
  const user = await createUser(overrides);
  const res = await request(app)
    .post('/sgla-api/login')
    .send({ email: user.email, password: 'Password@1' });
  return { user, token: res.body.accessToken };
}

describe('GET /sgla-api/users', () => {
  it('returns 200 with array for authenticated user', async () => {
    const { token } = await getUserWithToken();
    const res = await request(app)
      .get('/sgla-api/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/sgla-api/users');
    expect(res.status).toBe(401);
  });
});

describe('GET /sgla-api/users/:_id', () => {
  it('returns 200 with user data for a valid id', async () => {
    const user = await createUser();
    const res = await request(app).get(`/sgla-api/users/${user._id}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(user._id.toString());
  });

  it('returns 404 for non-existent user', async () => {
    const res = await request(app).get(
      '/sgla-api/users/507f1f77bcf86cd799439099',
    );
    expect(res.status).toBe(404);
  });
});

describe('PUT /sgla-api/users/:_id', () => {
  it('returns 200 when updating own user', async () => {
    const { user, token } = await getUserWithToken();
    const res = await request(app)
      .put(`/sgla-api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
  });

  it('returns 403 when updating another user', async () => {
    const { token } = await getUserWithToken();
    const other = await createUser();
    const res = await request(app)
      .put(`/sgla-api/users/${other._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hacker' });
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const user = await createUser();
    const res = await request(app)
      .put(`/sgla-api/users/${user._id}`)
      .send({ name: 'NoToken' });
    expect(res.status).toBe(401);
  });
});

describe('POST /sgla-api/users/forgot-password', () => {
  it('returns 200 for a known email', async () => {
    await createUser({ email: 'forgot@test.com' });
    const res = await request(app)
      .post('/sgla-api/users/forgot-password')
      .send({ email: 'forgot@test.com' });
    expect(res.status).toBe(200);
  });

  it('returns 404 for unknown email', async () => {
    const res = await request(app)
      .post('/sgla-api/users/forgot-password')
      .send({ email: 'nobody@nobody.com' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /sgla-api/users/:_id', () => {
  it('returns 204 when deleting own account', async () => {
    const { user, token } = await getUserWithToken({
      email: `del${Date.now()}@t.com`,
    });
    const res = await request(app)
      .delete(`/sgla-api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('returns 403 when deleting another user', async () => {
    const { token } = await getUserWithToken();
    const other = await createUser({ email: `del2${Date.now()}@t.com` });
    const res = await request(app)
      .delete(`/sgla-api/users/${other._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// PATCH /sgla-api/users/:_id  (update – own user via verifyOwnUser)
// Note: the route is actually PUT /:_id which also handles partial updates.
// The controller's `update` handler is invoked via PUT. Tests for PUT with
// own-user semantics already live above; these extend coverage for the
// dedicated `update` handler path.
// ---------------------------------------------------------------------------

describe('PUT /sgla-api/users/:_id (update)', () => {
  it('returns 200 and updates name for own user', async () => {
    const { user, token } = await getUserWithToken();
    const res = await request(app)
      .put(`/sgla-api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
  });

  it('returns 401 without authentication token', async () => {
    const user = await createUser();
    const res = await request(app)
      .put(`/sgla-api/users/${user._id}`)
      .send({ name: 'No Auth' });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// PUT /sgla-api/users/management/:_id  (updateByManagement – admin only)
// ---------------------------------------------------------------------------

async function getAdminWithToken() {
  const admin = await createAdminUser();
  const res = await request(app)
    .post('/sgla-api/login')
    .send({ email: admin.email, password: 'Password@1' });
  return { admin, token: res.body.accessToken };
}

describe('PUT /sgla-api/users/management/:_id (updateByManagement)', () => {
  it('returns 200 when admin updates another user', async () => {
    const { token } = await getAdminWithToken();
    const target = await createUser();
    const res = await request(app)
      .put(`/sgla-api/users/management/${target._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Admin Updated' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Admin Updated');
  });

  it('returns 403 when a regular user tries to use management route', async () => {
    const { token } = await getUserWithToken();
    const target = await createUser();
    const res = await request(app)
      .put(`/sgla-api/users/management/${target._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hacker' });
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const target = await createUser();
    const res = await request(app)
      .put(`/sgla-api/users/management/${target._id}`)
      .send({ name: 'NoToken' });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /sgla-api/users/management/:_id/reset-password (resetPasswordByManagement)
// ---------------------------------------------------------------------------

describe('POST /sgla-api/users/management/:_id/reset-password (resetPasswordByManagement)', () => {
  it('returns 200 and sends reset email when admin resets user password', async () => {
    const { token } = await getAdminWithToken();
    const target = await createUser();
    const res = await request(app)
      .post(`/sgla-api/users/management/${target._id}/reset-password`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('email');
    expect(res.body).toHaveProperty('name');
  });

  it('returns 403 when a regular user attempts to reset another password', async () => {
    const { token } = await getUserWithToken();
    const target = await createUser();
    const res = await request(app)
      .post(`/sgla-api/users/management/${target._id}/reset-password`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const target = await createUser();
    const res = await request(app).post(
      `/sgla-api/users/management/${target._id}/reset-password`,
    );
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// PUT /sgla-api/users/forgot-password/:token  (redefinePassword)
// ---------------------------------------------------------------------------

describe('PUT /sgla-api/users/forgot-password/:token (redefinePassword)', () => {
  it('returns 200 and updates the password with a valid token', async () => {
    // First trigger forgot-password to create a token in the DB
    const user = await createUser({ email: `redef${Date.now()}@test.com` });
    await request(app)
      .post('/sgla-api/users/forgot-password')
      .send({ email: user.email });

    // Retrieve the token from the DB directly
    const UserPwdTokenModel = (
      await import('../../models/UserPwdTokenModel.js')
    ).default;
    const record = await UserPwdTokenModel.findOne({ user: user._id })
      .lean()
      .exec();
    expect(record).not.toBeNull();

    const res = await request(app)
      .put(`/sgla-api/users/forgot-password/${record.token}`)
      .send({ newPassword: 'NewPass@1' });
    expect(res.status).toBe(200);
  });

  it('returns 403 with an invalid / non-existent token', async () => {
    const res = await request(app)
      .put('/sgla-api/users/forgot-password/invalid-token-value')
      .send({ newPassword: 'NewPass@1' });
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// PUT /sgla-api/users/:_id/change-password  (changePassword)
// ---------------------------------------------------------------------------

describe('PUT /sgla-api/users/:_id/change-password (changePassword)', () => {
  it('returns 200 when user changes password in mustChangePassword mode (no currentPassword required)', async () => {
    // Admin resets password so mustChangePassword is set to true
    const { token: adminToken } = await getAdminWithToken();
    const target = await createUser({
      email: `chgpwd${Date.now()}@test.com`,
    });
    await request(app)
      .post(`/sgla-api/users/management/${target._id}/reset-password`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Log in as that user (password is now the temporary one; but we can log in
    // via the test helper that already has the original password embedded in the
    // factory — we need to log in fresh after the management reset)
    // Instead of logging in we change the password as the target user before
    // the management reset for simplicity – use a separate user with
    // mustChangePassword forced to true at creation time.
    const mustChangeUser = await createUser({
      email: `mustchg${Date.now()}@test.com`,
      mustChangePassword: true,
    });
    const loginRes = await request(app)
      .post('/sgla-api/login')
      .send({ email: mustChangeUser.email, password: 'Password@1' });
    const mustChangeToken = loginRes.body.accessToken;

    const res = await request(app)
      .put(`/sgla-api/users/${mustChangeUser._id}/change-password`)
      .set('Authorization', `Bearer ${mustChangeToken}`)
      .send({ newPassword: 'Changed@99' });
    expect(res.status).toBe(200);
  });

  it('returns 403 when attempting to change another user password', async () => {
    const { token } = await getUserWithToken();
    const other = await createUser();
    const res = await request(app)
      .put(`/sgla-api/users/${other._id}/change-password`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newPassword: 'Hack@123' });
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const user = await createUser();
    const res = await request(app)
      .put(`/sgla-api/users/${user._id}/change-password`)
      .send({ newPassword: 'NoToken@1' });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /sgla-api/users/:_id/google-calendar/link-url (getGoogleCalendarLinkUrl)
// ---------------------------------------------------------------------------

describe('POST /sgla-api/users/:_id/google-calendar/link-url (getGoogleCalendarLinkUrl)', () => {
  it('returns 200 with an authUrl for own user', async () => {
    const { user, token } = await getUserWithToken();
    const res = await request(app)
      .post(`/sgla-api/users/${user._id}/google-calendar/link-url`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('authUrl');
  });

  it('returns 403 when accessing another user google calendar link url', async () => {
    const { token } = await getUserWithToken();
    const other = await createUser();
    const res = await request(app)
      .post(`/sgla-api/users/${other._id}/google-calendar/link-url`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const user = await createUser();
    const res = await request(app).post(
      `/sgla-api/users/${user._id}/google-calendar/link-url`,
    );
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// DELETE /sgla-api/users/:_id/google-calendar/link  (unlinkGoogleCalendar)
// ---------------------------------------------------------------------------

describe('DELETE /sgla-api/users/:_id/google-calendar/link (unlinkGoogleCalendar)', () => {
  it('returns 200 when unlinking own Google Calendar', async () => {
    const { user, token } = await getUserWithToken();
    const res = await request(app)
      .delete(`/sgla-api/users/${user._id}/google-calendar/link`)
      .set('Authorization', `Bearer ${token}`);
    // User may not have a linked calendar; the service still returns the updated user
    expect(res.status).toBe(200);
  });

  it('returns 403 when trying to unlink another user google calendar', async () => {
    const { token } = await getUserWithToken();
    const other = await createUser();
    const res = await request(app)
      .delete(`/sgla-api/users/${other._id}/google-calendar/link`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const user = await createUser();
    const res = await request(app).delete(
      `/sgla-api/users/${user._id}/google-calendar/link`,
    );
    expect(res.status).toBe(401);
  });
});
