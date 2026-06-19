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
import {
  createAdminUser,
  createAcademicLeague,
  createUniversity,
  createUser,
} from '../helpers/factories.js';

async function loginUser(user) {
  user.password = 'Password@1';
  user.emailVerified = true;
  await user.save();
  const res = await request(app)
    .post('/sgla-api/login')
    .send({ email: user.email, password: 'Password@1' });
  return res.body.accessToken;
}

describe('GET /sgla-api/academic-leagues', () => {
  it('returns 200 with array for admin user', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .get('/sgla-api/academic-leagues')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 403 for user without academicLeague.view permission', async () => {
    const user = await createUser();
    const token = await loginUser(user);
    const res = await request(app)
      .get('/sgla-api/academic-leagues')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/sgla-api/academic-leagues');
    expect(res.status).toBe(401);
  });
});

describe('POST /sgla-api/academic-leagues', () => {
  it('returns 201 when admin creates a league', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const res = await request(app)
      .post('/sgla-api/academic-leagues')
      .set('Authorization', `Bearer ${token}`)
      .send({
        university: university._id,
        name: 'Liga de Cardiologia',
        description: 'Estudos do coração',
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Liga de Cardiologia');
  });

  it('returns 403 when regular user tries to create', async () => {
    const user = await createUser();
    const token = await loginUser(user);
    const university = await createUniversity();
    const res = await request(app)
      .post('/sgla-api/academic-leagues')
      .set('Authorization', `Bearer ${token}`)
      .send({
        university: university._id,
        name: 'Liga Proibida',
        description: 'Não permitido',
      });
    expect(res.status).toBe(403);
  });

  it('returns 400 when name is missing', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const res = await request(app)
      .post('/sgla-api/academic-leagues')
      .set('Authorization', `Bearer ${token}`)
      .send({ university: university._id, description: 'Sem nome' });
    expect(res.status).toBe(400);
  });
});

describe('GET /sgla-api/academic-leagues/:_id', () => {
  it('returns 200 for a valid league', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const res = await request(app)
      .get(`/sgla-api/academic-leagues/${league._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(league._id.toString());
  });

  it('returns 404 for non-existent league', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .get('/sgla-api/academic-leagues/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /sgla-api/academic-leagues/:_id', () => {
  it('returns 200 when admin updates a league', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const res = await request(app)
      .patch(`/sgla-api/academic-leagues/${league._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Liga Atualizada' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Liga Atualizada');
  });
});

describe('DELETE /sgla-api/academic-leagues/:_id', () => {
  it('returns 204 when admin deletes a league', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const res = await request(app)
      .delete(`/sgla-api/academic-leagues/${league._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 for non-existent league', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .delete('/sgla-api/academic-leagues/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('returns 403 when regular user tries to delete', async () => {
    const user = await createUser();
    const token = await loginUser(user);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const res = await request(app)
      .delete(`/sgla-api/academic-leagues/${league._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
