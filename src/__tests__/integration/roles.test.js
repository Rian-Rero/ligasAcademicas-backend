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
      .mockResolvedValue({ url: 'https://cdn.test/file.pdf', key: 'test-key' }),
    deleteFile: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../../services/GoogleCalendarService.js', () => ({
  createGoogleCalendarEvent: vi
    .fn()
    .mockResolvedValue({
      googleEventId: 'google-event-id',
      refreshedTokenData: null,
    }),
  updateGoogleCalendarEvent: vi
    .fn()
    .mockResolvedValue({ refreshedTokenData: null }),
  deleteGoogleCalendarEvent: vi
    .fn()
    .mockResolvedValue({ refreshedTokenData: null }),
  getGoogleAuthorizationUrl: vi
    .fn()
    .mockReturnValue('https://accounts.google.com/auth'),
  resolveGoogleCallback: vi
    .fn()
    .mockResolvedValue({
      userId: 'user-id',
      googleEmail: 'test@gmail.com',
      tokenData: {},
    }),
}));

import app from '../../app.js';
import {
  createAdminUser,
  createRole,
  createPermission,
  createUser,
} from '../helpers/factories.js';
import RoleModel from '../../models/RoleModel.js';

async function loginUser(user) {
  user.password = 'Password@1';
  user.emailVerified = true;
  await user.save();
  const res = await request(app)
    .post('/sgla-api/login')
    .send({ email: user.email, password: 'Password@1' });
  return res.body.accessToken;
}

// =====================
// GET /sgla-api/permissions/roles
// =====================
describe('GET /sgla-api/permissions/roles', () => {
  it('returns 200 with an array of roles for admin', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .get('/sgla-api/permissions/roles')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns roles with populated permissions field', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const permission = await createPermission();
    const role = await createRole({ permissions: [permission._id] });
    const res = await request(app)
      .get('/sgla-api/permissions/roles')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const found = res.body.find((r) => r._id === role._id.toString());
    expect(found).toBeDefined();
    expect(Array.isArray(found.permissions)).toBe(true);
    expect(found.permissions[0]).toHaveProperty('key');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/sgla-api/permissions/roles');
    expect(res.status).toBe(401);
  });

  it('returns 403 for regular user', async () => {
    const user = await createUser();
    const token = await loginUser(user);
    const res = await request(app)
      .get('/sgla-api/permissions/roles')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('filters by isGlobal query param', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .get('/sgla-api/permissions/roles?isGlobal=true')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((r) => expect(r.isGlobal).toBe(true));
  });

  it('filters by isSystem query param', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .get('/sgla-api/permissions/roles?isSystem=false')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    res.body.forEach((r) => expect(r.isSystem).toBe(false));
  });
});

// =====================
// POST /sgla-api/permissions/roles
// =====================
describe('POST /sgla-api/permissions/roles', () => {
  it('returns 201 and creates a role with required fields', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const key = `custom_role_${Date.now()}`;
    const res = await request(app)
      .post('/sgla-api/permissions/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Custom Role', key });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.name).toBe('Custom Role');
    expect(res.body.key).toBe(key);
  });

  it('returns 201 and creates a role with optional fields', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const key = `opt_role_${Date.now()}`;
    const res = await request(app)
      .post('/sgla-api/permissions/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Optional Role',
        key,
        description: 'A role with optional fields',
        isGlobal: true,
        color: '#FF0000',
        priority: 10,
      });
    expect(res.status).toBe(201);
    expect(res.body.description).toBe('A role with optional fields');
    expect(res.body.isGlobal).toBe(true);
    expect(res.body.color).toBe('#FF0000');
    expect(res.body.priority).toBe(10);
  });

  it('returns 201 and populates permissions in the response', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const permission = await createPermission();
    const key = `perm_role_${Date.now()}`;
    const res = await request(app)
      .post('/sgla-api/permissions/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Role With Perm',
        key,
        permissions: [permission._id.toString()],
      });
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body.permissions)).toBe(true);
    expect(res.body.permissions[0]).toHaveProperty('key');
  });

  it('returns 409 if key already exists', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const existing = await createRole();
    const res = await request(app)
      .post('/sgla-api/permissions/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Duplicate Key Role', key: existing.key });
    expect(res.status).toBe(409);
  });

  it('returns 400 when name is missing', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .post('/sgla-api/permissions/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({ key: `no_name_${Date.now()}` });
    expect(res.status).toBe(400);
  });

  it('returns 400 when key is missing', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .post('/sgla-api/permissions/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No Key Role' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when key has invalid characters', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .post('/sgla-api/permissions/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bad Key Role', key: 'invalid-key!' });
    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/sgla-api/permissions/roles')
      .send({ name: 'Some Role', key: `unauth_${Date.now()}` });
    expect(res.status).toBe(401);
  });

  it('returns 403 for regular user', async () => {
    const user = await createUser();
    const token = await loginUser(user);
    const res = await request(app)
      .post('/sgla-api/permissions/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Forbidden Role', key: `forbidden_${Date.now()}` });
    expect(res.status).toBe(403);
  });
});

// =====================
// GET /sgla-api/permissions/roles/:_id
// =====================
describe('GET /sgla-api/permissions/roles/:_id', () => {
  it('returns 200 with role data for a valid id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const role = await createRole();
    const res = await request(app)
      .get(`/sgla-api/permissions/roles/${role._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(role._id.toString());
    expect(res.body.name).toBe(role.name);
    expect(res.body.key).toBe(role.key);
  });

  it('returns populated permissions array', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const permission = await createPermission();
    const role = await createRole({ permissions: [permission._id] });
    const res = await request(app)
      .get(`/sgla-api/permissions/roles/${role._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.permissions)).toBe(true);
    expect(res.body.permissions[0]).toHaveProperty('key');
    expect(res.body.permissions[0]).toHaveProperty('name');
  });

  it('returns 404 for non-existent role id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .get('/sgla-api/permissions/roles/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid id format', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .get('/sgla-api/permissions/roles/not-an-id')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const role = await createRole();
    const res = await request(app).get(
      `/sgla-api/permissions/roles/${role._id}`,
    );
    expect(res.status).toBe(401);
  });
});

// =====================
// PATCH /sgla-api/permissions/roles/:_id
// =====================
describe('PATCH /sgla-api/permissions/roles/:_id', () => {
  it('returns 200 and updates name', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const role = await createRole();
    const res = await request(app)
      .patch(`/sgla-api/permissions/roles/${role._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
  });

  it('returns 200 and updates description', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const role = await createRole();
    const res = await request(app)
      .patch(`/sgla-api/permissions/roles/${role._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Updated description' });
    expect(res.status).toBe(200);
    expect(res.body.description).toBe('Updated description');
  });

  it('returns 200 and updates color', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const role = await createRole();
    const res = await request(app)
      .patch(`/sgla-api/permissions/roles/${role._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ color: '#AABBCC' });
    expect(res.status).toBe(200);
    expect(res.body.color).toBe('#AABBCC');
  });

  it('returns 200 and returns populated permissions', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const permission = await createPermission();
    const role = await createRole({ permissions: [permission._id] });
    const res = await request(app)
      .patch(`/sgla-api/permissions/roles/${role._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Perm Role Updated' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.permissions)).toBe(true);
    expect(res.body.permissions[0]).toHaveProperty('key');
  });

  it('returns 404 for non-existent role id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .patch('/sgla-api/permissions/roles/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ghost Role' });
    expect(res.status).toBe(404);
  });

  it('returns 409 when trying to update a system role', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const systemRole = await createRole({ isSystem: true });
    const res = await request(app)
      .patch(`/sgla-api/permissions/roles/${systemRole._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cannot Edit System Role' });
    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid id format', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .patch('/sgla-api/permissions/roles/bad-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test' });
    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const role = await createRole();
    const res = await request(app)
      .patch(`/sgla-api/permissions/roles/${role._id}`)
      .send({ name: 'Updated' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for regular user', async () => {
    const user = await createUser();
    const token = await loginUser(user);
    const role = await createRole();
    const res = await request(app)
      .patch(`/sgla-api/permissions/roles/${role._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Forbidden Update' });
    expect(res.status).toBe(403);
  });
});

// =====================
// DELETE /sgla-api/permissions/roles/:_id
// =====================
describe('DELETE /sgla-api/permissions/roles/:_id', () => {
  it('returns 204 when role is successfully deleted', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const role = await createRole();
    const res = await request(app)
      .delete(`/sgla-api/permissions/roles/${role._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('actually removes the role from the database', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const role = await createRole();
    await request(app)
      .delete(`/sgla-api/permissions/roles/${role._id}`)
      .set('Authorization', `Bearer ${token}`);
    const found = await RoleModel.findById(role._id).exec();
    expect(found).toBeNull();
  });

  it('returns 404 for non-existent role id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .delete('/sgla-api/permissions/roles/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('returns 409 when trying to delete a system role', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const systemRole = await createRole({ isSystem: true });
    const res = await request(app)
      .delete(`/sgla-api/permissions/roles/${systemRole._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid id format', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .delete('/sgla-api/permissions/roles/invalid-id')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const role = await createRole();
    const res = await request(app).delete(
      `/sgla-api/permissions/roles/${role._id}`,
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 for regular user', async () => {
    const user = await createUser();
    const token = await loginUser(user);
    const role = await createRole();
    const res = await request(app)
      .delete(`/sgla-api/permissions/roles/${role._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// =====================
// POST /sgla-api/permissions/roles/:_id/permissions
// =====================
describe('POST /sgla-api/permissions/roles/:_id/permissions', () => {
  it('returns 200 and adds a permission to the role', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const role = await createRole();
    const permission = await createPermission();
    const res = await request(app)
      .post(`/sgla-api/permissions/roles/${role._id}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionId: permission._id.toString() });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.permissions)).toBe(true);
    expect(
      res.body.permissions.some((p) => p._id === permission._id.toString()),
    ).toBe(true);
  });

  it('returns populated permissions after adding', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const role = await createRole();
    const permission = await createPermission();
    const res = await request(app)
      .post(`/sgla-api/permissions/roles/${role._id}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionId: permission._id.toString() });
    expect(res.status).toBe(200);
    const added = res.body.permissions.find(
      (p) => p._id === permission._id.toString(),
    );
    expect(added).toHaveProperty('key');
    expect(added).toHaveProperty('name');
  });

  it('returns 409 if permission is already in the role', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const permission = await createPermission();
    const role = await createRole({ permissions: [permission._id] });
    const res = await request(app)
      .post(`/sgla-api/permissions/roles/${role._id}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionId: permission._id.toString() });
    expect(res.status).toBe(409);
  });

  it('returns 404 if role is not found', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const permission = await createPermission();
    const res = await request(app)
      .post('/sgla-api/permissions/roles/507f1f77bcf86cd799439099/permissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionId: permission._id.toString() });
    expect(res.status).toBe(404);
  });

  it('returns 404 if permission is not found', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const role = await createRole();
    const res = await request(app)
      .post(`/sgla-api/permissions/roles/${role._id}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionId: '507f1f77bcf86cd799439099' });
    expect(res.status).toBe(404);
  });

  it('returns 400 when permissionId is missing', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const role = await createRole();
    const res = await request(app)
      .post(`/sgla-api/permissions/roles/${role._id}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid role id format', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const permission = await createPermission();
    const res = await request(app)
      .post('/sgla-api/permissions/roles/bad-id/permissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionId: permission._id.toString() });
    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const role = await createRole();
    const permission = await createPermission();
    const res = await request(app)
      .post(`/sgla-api/permissions/roles/${role._id}/permissions`)
      .send({ permissionId: permission._id.toString() });
    expect(res.status).toBe(401);
  });

  it('returns 403 for regular user', async () => {
    const user = await createUser();
    const token = await loginUser(user);
    const role = await createRole();
    const permission = await createPermission();
    const res = await request(app)
      .post(`/sgla-api/permissions/roles/${role._id}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionId: permission._id.toString() });
    expect(res.status).toBe(403);
  });
});

// =====================
// DELETE /sgla-api/permissions/roles/:_id/permissions
// =====================
describe('DELETE /sgla-api/permissions/roles/:_id/permissions', () => {
  it('returns 200 and removes a permission from the role', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const permission = await createPermission();
    const role = await createRole({ permissions: [permission._id] });
    const res = await request(app)
      .delete(`/sgla-api/permissions/roles/${role._id}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionId: permission._id.toString() });
    expect(res.status).toBe(200);
    expect(
      res.body.permissions.some((p) => p._id === permission._id.toString()),
    ).toBe(false);
  });

  it('returns 200 and returns updated populated permissions list', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const permission1 = await createPermission();
    const permission2 = await createPermission();
    const role = await createRole({
      permissions: [permission1._id, permission2._id],
    });
    const res = await request(app)
      .delete(`/sgla-api/permissions/roles/${role._id}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionId: permission1._id.toString() });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.permissions)).toBe(true);
    expect(
      res.body.permissions.some((p) => p._id === permission1._id.toString()),
    ).toBe(false);
    expect(
      res.body.permissions.some((p) => p._id === permission2._id.toString()),
    ).toBe(true);
  });

  it('returns 200 even if permission was not in the role (idempotent removal)', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const role = await createRole();
    const permission = await createPermission();
    const res = await request(app)
      .delete(`/sgla-api/permissions/roles/${role._id}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionId: permission._id.toString() });
    expect(res.status).toBe(200);
  });

  it('returns 404 if role is not found', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const permission = await createPermission();
    const res = await request(app)
      .delete(
        '/sgla-api/permissions/roles/507f1f77bcf86cd799439099/permissions',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionId: permission._id.toString() });
    expect(res.status).toBe(404);
  });

  it('returns 400 when permissionId is missing', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const role = await createRole();
    const res = await request(app)
      .delete(`/sgla-api/permissions/roles/${role._id}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid role id format', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const permission = await createPermission();
    const res = await request(app)
      .delete('/sgla-api/permissions/roles/bad-id/permissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionId: permission._id.toString() });
    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const permission = await createPermission();
    const role = await createRole({ permissions: [permission._id] });
    const res = await request(app)
      .delete(`/sgla-api/permissions/roles/${role._id}/permissions`)
      .send({ permissionId: permission._id.toString() });
    expect(res.status).toBe(401);
  });

  it('returns 403 for regular user', async () => {
    const user = await createUser();
    const token = await loginUser(user);
    const permission = await createPermission();
    const role = await createRole({ permissions: [permission._id] });
    const res = await request(app)
      .delete(`/sgla-api/permissions/roles/${role._id}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionId: permission._id.toString() });
    expect(res.status).toBe(403);
  });
});
