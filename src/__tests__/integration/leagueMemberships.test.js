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
  createUser,
  createUniversity,
  createAcademicLeague,
} from '../helpers/factories.js';
import LeagueMembershipModel from '../../models/LeagueMembershipModel.js';
import AttendanceModel from '../../models/Attendance.js';
import CertificateModel from '../../models/CertificateModel.js';
import RoleHistoryModel from '../../models/RoleHistory.js';
import SquadModel from '../../models/SquadModel.js';
import EventModel from '../../models/EventModel.js';

async function loginUser(user) {
  user.password = 'Password@1';
  user.emailVerified = true;
  await user.save();
  const res = await request(app)
    .post('/sgla-api/login')
    .send({ email: user.email, password: 'Password@1' });
  return res.body.accessToken;
}

async function createMembership(userId, academicLeagueId, overrides = {}) {
  return LeagueMembershipModel.create({
    user: userId,
    academicLeague: academicLeagueId,
    role: 'membro',
    isActive: true,
    ...overrides,
  });
}

describe('GET /sgla-api/league-memberships', () => {
  it('returns 200 with array for admin', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .get('/sgla-api/league-memberships')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/sgla-api/league-memberships');
    expect(res.status).toBe(401);
  });
});

describe('POST /sgla-api/league-memberships', () => {
  it('returns 201 when creating a league-type membership', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);

    const res = await request(app)
      .post('/sgla-api/league-memberships')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user: user._id,
        academicLeague: league._id,
        membershipType: 'league',
        role: 'membro',
        isActive: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.role).toBe('membro');
    expect(res.body.isActive).toBe(true);
    expect(res.body.user.toString()).toBe(user._id.toString());
    expect(res.body.academicLeague.toString()).toBe(league._id.toString());
  });

  it('returns 201 when creating a university-type membership', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();

    const res = await request(app)
      .post('/sgla-api/league-memberships')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user: user._id,
        university: university._id,
        membershipType: 'university',
        role: 'coordenador',
        isActive: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.role).toBe('coordenador');
    expect(res.body.isActive).toBe(true);
    expect(res.body.user.toString()).toBe(user._id.toString());
    expect(res.body.university.toString()).toBe(university._id.toString());
  });

  it('returns 400 when required fields are missing', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .post('/sgla-api/league-memberships')
      .set('Authorization', `Bearer ${token}`)
      .send({
        role: 'membro',
      });

    expect(res.status).toBe(400);
  });

  it('returns 400 when role is missing', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);

    const res = await request(app)
      .post('/sgla-api/league-memberships')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user: user._id,
        academicLeague: league._id,
        isActive: true,
      });

    expect(res.status).toBe(400);
  });

  it('returns 400 when isActive is missing', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);

    const res = await request(app)
      .post('/sgla-api/league-memberships')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user: user._id,
        academicLeague: league._id,
        role: 'membro',
      });

    expect(res.status).toBe(400);
  });

  it('returns 404 when user does not exist', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);

    const res = await request(app)
      .post('/sgla-api/league-memberships')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user: '507f1f77bcf86cd799439099',
        academicLeague: league._id,
        membershipType: 'league',
        role: 'membro',
        isActive: true,
      });

    expect(res.status).toBe(404);
  });

  it('returns 404 when academic league does not exist', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();

    const res = await request(app)
      .post('/sgla-api/league-memberships')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user: user._id,
        academicLeague: '507f1f77bcf86cd799439099',
        membershipType: 'league',
        role: 'membro',
        isActive: true,
      });

    expect(res.status).toBe(404);
  });

  it('returns 404 when university does not exist for university-type membership', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();

    const res = await request(app)
      .post('/sgla-api/league-memberships')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user: user._id,
        university: '507f1f77bcf86cd799439099',
        membershipType: 'university',
        role: 'membro',
        isActive: true,
      });

    expect(res.status).toBe(404);
  });
});

describe('GET /sgla-api/league-memberships/inactive', () => {
  it('returns 200 with array of inactive memberships', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);

    await createMembership(user._id, league._id, { isActive: false });

    const res = await request(app)
      .get('/sgla-api/league-memberships/inactive')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const allInactive = res.body.every((m) => m.isActive === false);
    expect(allInactive).toBe(true);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/sgla-api/league-memberships/inactive');
    expect(res.status).toBe(401);
  });
});

describe('GET /sgla-api/league-memberships/:_id', () => {
  it('returns 200 for a valid membership', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id);

    const res = await request(app)
      .get(`/sgla-api/league-memberships/${membership._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(membership._id.toString());
  });

  it('returns 404 for non-existent membership', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .get('/sgla-api/league-memberships/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('PATCH /sgla-api/league-memberships/:_id', () => {
  it('returns 200 when updating a membership', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id, {
      role: 'membro',
    });

    const res = await request(app)
      .patch(`/sgla-api/league-memberships/${membership._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'coordenador' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('coordenador');
  });

  it('returns 404 for non-existent membership', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .patch('/sgla-api/league-memberships/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'coordenador' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /sgla-api/league-memberships/:_id', () => {
  it('returns 204 when deleting a membership with no linked data', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id);

    const res = await request(app)
      .delete(`/sgla-api/league-memberships/${membership._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it('returns 409 when membership has linked attendance', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id);

    const event = await EventModel.create({
      academicLeague: league._id,
      title: 'Evento Teste',
      description: 'Descrição do evento teste',
      dateTime: new Date(Date.now() + 86400000),
      location: 'Auditório Central',
    });

    await AttendanceModel.create({
      event: event._id,
      leagueMembership: membership._id,
      isConfirmed: false,
      hasAttended: false,
    });

    const res = await request(app)
      .delete(`/sgla-api/league-memberships/${membership._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
  });

  it('returns 409 when membership has linked certificate', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id);

    await CertificateModel.create({
      leagueMembership: membership._id,
      workLoadHours: 40,
      issueDate: new Date(),
      pdfUrl: 'https://cdn.test/certificate.pdf',
    });

    const res = await request(app)
      .delete(`/sgla-api/league-memberships/${membership._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
  });

  it('returns 409 when membership has linked role history', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id);

    const squad = await SquadModel.create({
      academicLeague: league._id,
      name: `Squad Teste ${Date.now()}`,
      description: 'Squad para teste de role history',
    });

    await RoleHistoryModel.create({
      leagueMembership: membership._id,
      squad: squad._id,
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(),
    });

    const res = await request(app)
      .delete(`/sgla-api/league-memberships/${membership._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
  });

  it('returns 404 for non-existent membership', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .delete('/sgla-api/league-memberships/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('PATCH /sgla-api/league-memberships/:_id/end', () => {
  it('returns 200 when ending an active membership', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);

    const squad = await SquadModel.create({
      academicLeague: league._id,
      name: `Squad End Test ${Date.now()}`,
      description: 'Squad para teste de encerramento',
    });

    const membership = await LeagueMembershipModel.create({
      user: user._id,
      academicLeague: league._id,
      squad: squad._id,
      role: 'membro',
      isActive: true,
    });

    const res = await request(app)
      .patch(`/sgla-api/league-memberships/${membership._id}/end`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(false);
  });

  it('returns 409 when membership is already inactive', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id, {
      isActive: false,
    });

    const res = await request(app)
      .patch(`/sgla-api/league-memberships/${membership._id}/end`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
  });

  it('returns 404 for non-existent membership', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .patch('/sgla-api/league-memberships/507f1f77bcf86cd799439099/end')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
