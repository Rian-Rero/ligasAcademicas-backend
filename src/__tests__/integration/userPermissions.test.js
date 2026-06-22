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
import {
  createUser,
  createAdminUser,
  createRole,
  createPermission,
} from '../helpers/factories.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAdminWithToken() {
  const admin = await createAdminUser();
  const res = await request(app)
    .post('/sgla-api/login')
    .send({ email: admin.email, password: 'Password@1' });
  return { admin, token: res.body.accessToken };
}

async function getRegularUserWithToken() {
  const user = await createUser();
  const res = await request(app)
    .post('/sgla-api/login')
    .send({ email: user.email, password: 'Password@1' });
  return { user, token: res.body.accessToken };
}

// ---------------------------------------------------------------------------
// GET /sgla-api/permissions/users/:userId/permissions
// ---------------------------------------------------------------------------

describe('GET /sgla-api/permissions/users/:userId/permissions (getUserPermissions)', () => {
  it('returns 200 with permissions array when called by admin', async () => {
    const { token } = await getAdminWithToken();
    const target = await createUser();
    const res = await request(app)
      .get(`/sgla-api/permissions/users/${target._id}/permissions`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('returns 403 when called by a regular user', async () => {
    const { token } = await getRegularUserWithToken();
    const target = await createUser();
    const res = await request(app)
      .get(`/sgla-api/permissions/users/${target._id}/permissions`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const target = await createUser();
    const res = await request(app).get(
      `/sgla-api/permissions/users/${target._id}/permissions`,
    );
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /sgla-api/permissions/users/:userId/permissions/details
// ---------------------------------------------------------------------------

describe('GET /sgla-api/permissions/users/:userId/permissions/details (getUserPermissionDetails)', () => {
  it('returns 200 when called by admin', async () => {
    const { token } = await getAdminWithToken();
    const target = await createUser();
    const res = await request(app)
      .get(`/sgla-api/permissions/users/${target._id}/permissions/details`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('returns 403 when called by a regular user', async () => {
    const { token } = await getRegularUserWithToken();
    const target = await createUser();
    const res = await request(app)
      .get(`/sgla-api/permissions/users/${target._id}/permissions/details`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// PATCH /sgla-api/permissions/users/:userId/permissions (updateUserPermissions)
// ---------------------------------------------------------------------------

describe('PATCH /sgla-api/permissions/users/:userId/permissions (updateUserPermissions)', () => {
  it('returns 200 when admin bulk-updates user permissions', async () => {
    const { token } = await getAdminWithToken();
    const target = await createUser();
    const role = await createRole();
    const res = await request(app)
      .patch(`/sgla-api/permissions/users/${target._id}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roles: [role._id.toString()], permissions: [] });
    expect(res.status).toBe(200);
  });

  it('returns 403 when a regular user attempts bulk-update', async () => {
    const { token } = await getRegularUserWithToken();
    const target = await createUser();
    const res = await request(app)
      .patch(`/sgla-api/permissions/users/${target._id}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roles: [], permissions: [] });
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const target = await createUser();
    const res = await request(app)
      .patch(`/sgla-api/permissions/users/${target._id}/permissions`)
      .send({ roles: [], permissions: [] });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /sgla-api/permissions/users/:userId/roles (addRoleToUser)
// ---------------------------------------------------------------------------

describe('POST /sgla-api/permissions/users/:userId/roles (addRoleToUser)', () => {
  it('returns 200 when admin adds a role to a user', async () => {
    const { token } = await getAdminWithToken();
    const target = await createUser();
    const role = await createRole();
    const res = await request(app)
      .post(`/sgla-api/permissions/users/${target._id}/roles`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roleId: role._id.toString() });
    expect(res.status).toBe(200);
  });

  it('returns 403 when a regular user attempts to add a role', async () => {
    const { token } = await getRegularUserWithToken();
    const target = await createUser();
    const role = await createRole();
    const res = await request(app)
      .post(`/sgla-api/permissions/users/${target._id}/roles`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roleId: role._id.toString() });
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const target = await createUser();
    const role = await createRole();
    const res = await request(app)
      .post(`/sgla-api/permissions/users/${target._id}/roles`)
      .send({ roleId: role._id.toString() });
    expect(res.status).toBe(401);
  });

  it('returns 400 when roleId is missing', async () => {
    const { token } = await getAdminWithToken();
    const target = await createUser();
    const res = await request(app)
      .post(`/sgla-api/permissions/users/${target._id}/roles`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// DELETE /sgla-api/permissions/users/:userId/roles (removeRoleFromUser)
// ---------------------------------------------------------------------------

describe('DELETE /sgla-api/permissions/users/:userId/roles (removeRoleFromUser)', () => {
  it('returns 200 when admin removes a role from a user', async () => {
    const { token } = await getAdminWithToken();
    const target = await createUser();
    const role = await createRole();

    // First add the role so it can be removed
    await request(app)
      .post(`/sgla-api/permissions/users/${target._id}/roles`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roleId: role._id.toString() });

    const res = await request(app)
      .delete(`/sgla-api/permissions/users/${target._id}/roles`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roleId: role._id.toString() });
    expect(res.status).toBe(200);
  });

  it('returns 403 when a regular user attempts to remove a role', async () => {
    const { token } = await getRegularUserWithToken();
    const target = await createUser();
    const role = await createRole();
    const res = await request(app)
      .delete(`/sgla-api/permissions/users/${target._id}/roles`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roleId: role._id.toString() });
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const target = await createUser();
    const role = await createRole();
    const res = await request(app)
      .delete(`/sgla-api/permissions/users/${target._id}/roles`)
      .send({ roleId: role._id.toString() });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /sgla-api/permissions/users/:userId/permissions-direct (addPermissionToUser)
// ---------------------------------------------------------------------------

describe('POST /sgla-api/permissions/users/:userId/permissions-direct (addPermissionToUser)', () => {
  it('returns 200 when admin adds a direct permission to a user', async () => {
    const { token } = await getAdminWithToken();
    const target = await createUser();
    const permission = await createPermission();
    const res = await request(app)
      .post(`/sgla-api/permissions/users/${target._id}/permissions-direct`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionId: permission._id.toString() });
    expect(res.status).toBe(200);
  });

  it('returns 403 when a regular user attempts to add a direct permission', async () => {
    const { token } = await getRegularUserWithToken();
    const target = await createUser();
    const permission = await createPermission();
    const res = await request(app)
      .post(`/sgla-api/permissions/users/${target._id}/permissions-direct`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionId: permission._id.toString() });
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const target = await createUser();
    const permission = await createPermission();
    const res = await request(app)
      .post(`/sgla-api/permissions/users/${target._id}/permissions-direct`)
      .send({ permissionId: permission._id.toString() });
    expect(res.status).toBe(401);
  });

  it('returns 400 when permissionId is missing', async () => {
    const { token } = await getAdminWithToken();
    const target = await createUser();
    const res = await request(app)
      .post(`/sgla-api/permissions/users/${target._id}/permissions-direct`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// DELETE /sgla-api/permissions/users/:userId/permissions-direct (removePermissionFromUser)
// ---------------------------------------------------------------------------

describe('DELETE /sgla-api/permissions/users/:userId/permissions-direct (removePermissionFromUser)', () => {
  it('returns 200 when admin removes a direct permission from a user', async () => {
    const { token } = await getAdminWithToken();
    const target = await createUser();
    const permission = await createPermission();

    // First add the permission so it can be removed
    await request(app)
      .post(`/sgla-api/permissions/users/${target._id}/permissions-direct`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionId: permission._id.toString() });

    const res = await request(app)
      .delete(`/sgla-api/permissions/users/${target._id}/permissions-direct`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionId: permission._id.toString() });
    expect(res.status).toBe(200);
  });

  it('returns 403 when a regular user attempts to remove a direct permission', async () => {
    const { token } = await getRegularUserWithToken();
    const target = await createUser();
    const permission = await createPermission();
    const res = await request(app)
      .delete(`/sgla-api/permissions/users/${target._id}/permissions-direct`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionId: permission._id.toString() });
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const target = await createUser();
    const permission = await createPermission();
    const res = await request(app)
      .delete(`/sgla-api/permissions/users/${target._id}/permissions-direct`)
      .send({ permissionId: permission._id.toString() });
    expect(res.status).toBe(401);
  });
});
