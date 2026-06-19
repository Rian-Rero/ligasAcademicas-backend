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
  createPermission,
  createUser,
  createRole,
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

describe('GET /sgla-api/permissions', () => {
  it('returns 200 with array for admin', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .get('/sgla-api/permissions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/sgla-api/permissions');
    expect(res.status).toBe(401);
  });

  it('returns 403 for regular user', async () => {
    const user = await createUser();
    const token = await loginUser(user);
    const res = await request(app)
      .get('/sgla-api/permissions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('POST /sgla-api/permissions', () => {
  it('returns 201 when admin creates a permission', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .post('/sgla-api/permissions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        key: `event.test_${Date.now()}`,
        name: 'Test Permission',
        module: 'event',
      });
    expect(res.status).toBe(201);
  });

  it('returns 400 for invalid module', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .post('/sgla-api/permissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ key: 'test.perm', name: 'Test', module: 'invalid' });
    expect(res.status).toBe(400);
  });
});

describe('GET /sgla-api/permissions/roles', () => {
  it('returns 200 with array for admin', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .get('/sgla-api/permissions/roles')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /sgla-api/permissions/roles', () => {
  it('returns 201 when admin creates a role', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .post('/sgla-api/permissions/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Role', key: `test_role_${Date.now()}` });
    expect(res.status).toBe(201);
  });
});

describe('GET /sgla-api/permissions/:_id', () => {
  it('returns 200 for valid permission id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const permission = await createPermission();
    const res = await request(app)
      .get(`/sgla-api/permissions/${permission._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(permission._id.toString());
  });

  it('returns 404 for non-existent permission', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .get('/sgla-api/permissions/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /sgla-api/permissions/roles/:_id', () => {
  it('returns 200 when admin updates a role', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const role = await createRole();
    const res = await request(app)
      .patch(`/sgla-api/permissions/roles/${role._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Role Name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Role Name');
  });
});
