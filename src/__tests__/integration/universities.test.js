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
import { createAdminUser, createUniversity } from '../helpers/factories.js';

async function loginUser(user) {
  user.password = 'Password@1';
  user.emailVerified = true;
  await user.save();
  const res = await request(app)
    .post('/sgla-api/login')
    .send({ email: user.email, password: 'Password@1' });
  return res.body.accessToken;
}

describe('GET /sgla-api/universities', () => {
  it('returns 200 with array for admin', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .get('/sgla-api/universities')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/sgla-api/universities');
    expect(res.status).toBe(401);
  });
});

describe('POST /sgla-api/universities', () => {
  it('returns 201 when admin creates a university', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .post('/sgla-api/universities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Universidade Teste',
        street: 'Rua das Flores',
        number: 100,
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Universidade Teste');
  });

  it('returns 400 when required fields are missing', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .post('/sgla-api/universities')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Universidade' });
    expect(res.status).toBe(400);
  });
});

describe('GET /sgla-api/universities/:_id', () => {
  it('returns 200 for a valid university', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const res = await request(app)
      .get(`/sgla-api/universities/${university._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(university._id.toString());
  });

  it('returns 404 for non-existent university', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .get('/sgla-api/universities/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /sgla-api/universities/:_id', () => {
  it('returns 200 when admin updates a university', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const res = await request(app)
      .patch(`/sgla-api/universities/${university._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Universidade Atualizada' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Universidade Atualizada');
  });
});

describe('DELETE /sgla-api/universities/:_id', () => {
  it('returns 204 when admin deletes a university', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const res = await request(app)
      .delete(`/sgla-api/universities/${university._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 for non-existent university', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .delete('/sgla-api/universities/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
