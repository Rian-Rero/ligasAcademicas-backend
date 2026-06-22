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
  createUniversity,
  createAcademicLeague,
  createUser,
} from '../helpers/factories.js';
import SquadModel from '../../models/SquadModel.js';
import LeagueMembershipModel from '../../models/LeagueMembershipModel.js';

async function loginUser(user) {
  user.password = 'Password@1';
  user.emailVerified = true;
  await user.save();
  const res = await request(app)
    .post('/sgla-api/login')
    .send({ email: user.email, password: 'Password@1' });
  return res.body.accessToken;
}

async function createSquad(academicLeagueId, overrides = {}) {
  return SquadModel.create({
    academicLeague: academicLeagueId,
    name: `Squad Teste ${Date.now()}-${Math.random()}`,
    description: 'Descrição do squad teste',
    ...overrides,
  });
}

describe('GET /sgla-api/squads', () => {
  it('returns 200 with array for admin', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .get('/sgla-api/squads')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/sgla-api/squads');
    expect(res.status).toBe(401);
  });
});

describe('POST /sgla-api/squads', () => {
  it('returns 201 when admin creates a squad', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const res = await request(app)
      .post('/sgla-api/squads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        academicLeague: league._id,
        name: 'Squad de Cardiologia',
        description: 'Grupo focado em estudos cardiovasculares',
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Squad de Cardiologia');
  });

  it('returns 400 when name is missing', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const res = await request(app)
      .post('/sgla-api/squads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        academicLeague: league._id,
        description: 'Sem nome',
      });
    expect(res.status).toBe(400);
  });

  it('returns 404 when academicLeague does not exist', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .post('/sgla-api/squads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        academicLeague: '507f1f77bcf86cd799439099',
        name: 'Squad Inexistente',
        description: 'Liga inexistente',
      });
    expect(res.status).toBe(404);
  });
});

describe('GET /sgla-api/squads/:_id', () => {
  it('returns 200 for a valid squad', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const squad = await createSquad(league._id);
    const res = await request(app)
      .get(`/sgla-api/squads/${squad._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(squad._id.toString());
  });

  it('returns 404 for non-existent squad', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .get('/sgla-api/squads/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /sgla-api/squads/:_id', () => {
  it('returns 200 when admin updates a squad', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const squad = await createSquad(league._id);
    const res = await request(app)
      .patch(`/sgla-api/squads/${squad._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Squad Atualizado' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Squad Atualizado');
  });

  it('returns 404 for non-existent squad', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .patch('/sgla-api/squads/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Atualização Inválida' });
    expect(res.status).toBe(404);
  });

  it('returns 409 when changing academicLeague of a squad with linked members', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const otherLeague = await createAcademicLeague(university._id);
    const squad = await createSquad(league._id);
    const user = await createUser();
    await LeagueMembershipModel.create({
      user: user._id,
      academicLeague: league._id,
      squad: squad._id,
      role: 'member',
      isActive: true,
    });
    const res = await request(app)
      .patch(`/sgla-api/squads/${squad._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ academicLeague: otherLeague._id });
    expect(res.status).toBe(409);
  });
});

describe('DELETE /sgla-api/squads/:_id', () => {
  it('returns 204 when admin deletes a squad', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const squad = await createSquad(league._id);
    const res = await request(app)
      .delete(`/sgla-api/squads/${squad._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 for non-existent squad', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .delete('/sgla-api/squads/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('returns 409 when squad has linked members', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const squad = await createSquad(league._id);
    const user = await createUser();
    await LeagueMembershipModel.create({
      user: user._id,
      academicLeague: league._id,
      squad: squad._id,
      role: 'member',
      isActive: true,
    });
    const res = await request(app)
      .delete(`/sgla-api/squads/${squad._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
  });
});
