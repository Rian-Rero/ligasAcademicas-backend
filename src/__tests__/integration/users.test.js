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

import app from '../../app.js';
import { createUser } from '../helpers/factories.js';

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
