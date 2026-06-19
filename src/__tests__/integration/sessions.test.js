import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../mail/handlers.js', () => ({
  confirmEmail: vi.fn().mockResolvedValue(true),
  redefinePasswordEmail: vi.fn().mockResolvedValue(true),
  managementPasswordResetEmail: vi.fn().mockResolvedValue(true),
  taskDelegated: vi.fn().mockResolvedValue(true),
  taskCompleted: vi.fn().mockResolvedValue(true),
}));

import app from '../../app.js';
import { createUser } from '../helpers/factories.js';

describe('POST /sgla-api/login', () => {
  it('returns 200 with accessToken for valid credentials', async () => {
    await createUser({
      email: 'login-int@test.com',
      password: 'Password@1',
      emailVerified: true,
    });

    const res = await request(app)
      .post('/sgla-api/login')
      .send({ email: 'login-int@test.com', password: 'Password@1' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/sgla-api/login')
      .send({ email: 'nobody@noone.com', password: 'Password@1' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for wrong password', async () => {
    await createUser({
      email: 'wrongpwd-int@test.com',
      password: 'Password@1',
      emailVerified: true,
    });
    const res = await request(app)
      .post('/sgla-api/login')
      .send({ email: 'wrongpwd-int@test.com', password: 'BadPassword' });
    expect(res.status).toBe(401);
  });

  it('returns 403 when email is not verified', async () => {
    await createUser({
      email: 'noverify-int@test.com',
      password: 'Password@1',
      emailVerified: false,
    });
    const res = await request(app)
      .post('/sgla-api/login')
      .send({ email: 'noverify-int@test.com', password: 'Password@1' });
    expect(res.status).toBe(403);
  });

  it('returns 400 when email field is missing', async () => {
    const res = await request(app)
      .post('/sgla-api/login')
      .send({ password: 'Password@1' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password field is missing', async () => {
    const res = await request(app)
      .post('/sgla-api/login')
      .send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /sgla-api/logout', () => {
  it('returns 204 and clears cookie', async () => {
    await createUser({
      email: 'logout-int@test.com',
      password: 'Password@1',
      emailVerified: true,
    });
    const loginRes = await request(app)
      .post('/sgla-api/login')
      .send({ email: 'logout-int@test.com', password: 'Password@1' });

    const cookie = loginRes.headers['set-cookie'][0];

    const res = await request(app)
      .post('/sgla-api/logout')
      .set('Cookie', cookie);

    expect(res.status).toBe(204);
  });

  it('returns 204 even without a cookie', async () => {
    const res = await request(app).post('/sgla-api/logout');
    expect(res.status).toBe(204);
  });
});

describe('GET /sgla-api/refresh', () => {
  it('returns 200 with new accessToken for a valid refresh cookie', async () => {
    await createUser({
      email: 'refresh-int@test.com',
      password: 'Password@1',
      emailVerified: true,
    });
    const loginRes = await request(app)
      .post('/sgla-api/login')
      .send({ email: 'refresh-int@test.com', password: 'Password@1' });

    const cookie = loginRes.headers['set-cookie'][0];

    const res = await request(app)
      .get('/sgla-api/refresh')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('returns 401 when no refresh cookie is present', async () => {
    const res = await request(app).get('/sgla-api/refresh');
    expect(res.status).toBe(401);
  });
});
