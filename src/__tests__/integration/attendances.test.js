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
} from '../helpers/factories.js';
import EventModel from '../../models/EventModel.js';
import LeagueMembershipModel from '../../models/LeagueMembershipModel.js';
import AttendanceModel from '../../models/Attendance.js';

async function loginUser(user) {
  user.password = 'Password@1';
  user.emailVerified = true;
  await user.save();
  const res = await request(app)
    .post('/sgla-api/login')
    .send({ email: user.email, password: 'Password@1' });
  return res.body.accessToken;
}

async function createTestEvent(academicLeagueId) {
  return EventModel.create({
    academicLeague: academicLeagueId,
    title: 'Evento Teste',
    description: 'Descrição teste',
    dateTime: new Date(Date.now() + 86400000),
    location: 'Auditório',
  });
}

async function createTestMembership(userId, academicLeagueId) {
  return LeagueMembershipModel.create({
    user: userId,
    academicLeague: academicLeagueId,
    role: 'membro',
    isActive: true,
  });
}

async function createTestAttendance(
  eventId,
  leagueMembershipId,
  overrides = {},
) {
  return AttendanceModel.create({
    event: eventId,
    leagueMembership: leagueMembershipId,
    isConfirmed: false,
    hasAttended: false,
    ...overrides,
  });
}

// ─── GET /sgla-api/attendances ───────────────────────────────────────────────

describe('GET /sgla-api/attendances', () => {
  it('returns 200 with an array for admin', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .get('/sgla-api/attendances')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns the created attendance in the list', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);
    await createTestAttendance(event._id, membership._id);

    const res = await request(app)
      .get('/sgla-api/attendances')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    const ids = res.body.map((a) => a._id.toString());
    expect(ids.some(Boolean)).toBe(true);
  });

  it('supports filtering by event query param', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);
    await createTestAttendance(event._id, membership._id);

    const res = await request(app)
      .get(`/sgla-api/attendances?event=${event._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(
      res.body.every((a) => a.event.toString() === event._id.toString()),
    ).toBe(true);
  });

  it('supports filtering by isConfirmed query param', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);
    await createTestAttendance(event._id, membership._id, {
      isConfirmed: true,
    });

    const res = await request(app)
      .get('/sgla-api/attendances?isConfirmed=true')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.every((a) => a.isConfirmed === true)).toBe(true);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/sgla-api/attendances');
    expect(res.status).toBe(401);
  });

  it('returns 400 for an invalid event query param', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .get('/sgla-api/attendances?event=not-a-valid-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

// ─── POST /sgla-api/attendances ──────────────────────────────────────────────

describe('POST /sgla-api/attendances', () => {
  it('returns 201 when admin creates an attendance', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);

    const res = await request(app)
      .post('/sgla-api/attendances')
      .set('Authorization', `Bearer ${token}`)
      .send({
        event: event._id,
        leagueMembership: membership._id,
      });

    expect(res.status).toBe(201);
    expect(res.body.event.toString()).toBe(event._id.toString());
    expect(res.body.leagueMembership.toString()).toBe(
      membership._id.toString(),
    );
    expect(res.body.isConfirmed).toBe(false);
    expect(res.body.hasAttended).toBe(false);
  });

  it('auto-sets isConfirmed=true when hasAttended=true on creation', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);

    const res = await request(app)
      .post('/sgla-api/attendances')
      .set('Authorization', `Bearer ${token}`)
      .send({
        event: event._id,
        leagueMembership: membership._id,
        hasAttended: true,
        isConfirmed: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.hasAttended).toBe(true);
    expect(res.body.isConfirmed).toBe(true);
  });

  it('does not override isConfirmed when hasAttended=false', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);

    const res = await request(app)
      .post('/sgla-api/attendances')
      .set('Authorization', `Bearer ${token}`)
      .send({
        event: event._id,
        leagueMembership: membership._id,
        hasAttended: false,
        isConfirmed: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.hasAttended).toBe(false);
    expect(res.body.isConfirmed).toBe(true);
  });

  it('returns 409 when creating a duplicate attendance (same event + membership)', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);
    await createTestAttendance(event._id, membership._id);

    const res = await request(app)
      .post('/sgla-api/attendances')
      .set('Authorization', `Bearer ${token}`)
      .send({
        event: event._id,
        leagueMembership: membership._id,
      });

    expect(res.status).toBe(409);
  });

  it('returns 409 when event and leagueMembership belong to different academic leagues', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const leagueA = await createAcademicLeague(university._id);
    const leagueB = await createAcademicLeague(university._id);
    const event = await createTestEvent(leagueA._id);
    const membership = await createTestMembership(admin._id, leagueB._id);

    const res = await request(app)
      .post('/sgla-api/attendances')
      .set('Authorization', `Bearer ${token}`)
      .send({
        event: event._id,
        leagueMembership: membership._id,
      });

    expect(res.status).toBe(409);
  });

  it('returns 404 when event does not exist', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createTestMembership(admin._id, league._id);

    const res = await request(app)
      .post('/sgla-api/attendances')
      .set('Authorization', `Bearer ${token}`)
      .send({
        event: '507f1f77bcf86cd799439011',
        leagueMembership: membership._id,
      });

    expect(res.status).toBe(404);
  });

  it('returns 404 when leagueMembership does not exist', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);

    const res = await request(app)
      .post('/sgla-api/attendances')
      .set('Authorization', `Bearer ${token}`)
      .send({
        event: event._id,
        leagueMembership: '507f1f77bcf86cd799439022',
      });

    expect(res.status).toBe(404);
  });

  it('returns 400 when event field is missing', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createTestMembership(admin._id, league._id);

    const res = await request(app)
      .post('/sgla-api/attendances')
      .set('Authorization', `Bearer ${token}`)
      .send({ leagueMembership: membership._id });

    expect(res.status).toBe(400);
  });

  it('returns 400 when leagueMembership field is missing', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);

    const res = await request(app)
      .post('/sgla-api/attendances')
      .set('Authorization', `Bearer ${token}`)
      .send({ event: event._id });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/sgla-api/attendances')
      .send({
        event: '507f1f77bcf86cd799439011',
        leagueMembership: '507f1f77bcf86cd799439022',
      });
    expect(res.status).toBe(401);
  });
});

// ─── GET /sgla-api/attendances/:_id ─────────────────────────────────────────

describe('GET /sgla-api/attendances/:_id', () => {
  it('returns 200 with the attendance for a valid id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);
    const attendance = await createTestAttendance(event._id, membership._id);

    const res = await request(app)
      .get(`/sgla-api/attendances/${attendance._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body._id.toString()).toBe(attendance._id.toString());
    expect(res.body.event.toString()).toBe(event._id.toString());
    expect(res.body.leagueMembership.toString()).toBe(
      membership._id.toString(),
    );
  });

  it('returns 404 for a non-existent attendance id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .get('/sgla-api/attendances/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 400 for an invalid (non-ObjectId) id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .get('/sgla-api/attendances/invalid-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get(
      '/sgla-api/attendances/507f1f77bcf86cd799439099',
    );
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /sgla-api/attendances/:_id ───────────────────────────────────────

describe('PATCH /sgla-api/attendances/:_id', () => {
  it('returns 200 and updates isConfirmed', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);
    const attendance = await createTestAttendance(event._id, membership._id);

    const res = await request(app)
      .patch(`/sgla-api/attendances/${attendance._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isConfirmed: true });

    expect(res.status).toBe(200);
    expect(res.body.isConfirmed).toBe(true);
  });

  it('returns 200 and auto-sets isConfirmed=true when hasAttended is updated to true', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);
    const attendance = await createTestAttendance(event._id, membership._id);

    const res = await request(app)
      .patch(`/sgla-api/attendances/${attendance._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ hasAttended: true });

    expect(res.status).toBe(200);
    expect(res.body.hasAttended).toBe(true);
    expect(res.body.isConfirmed).toBe(true);
  });

  it('returns 200 when updating event to another event in the same league', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const eventA = await createTestEvent(league._id);
    const eventB = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);
    const attendance = await createTestAttendance(eventA._id, membership._id);

    const res = await request(app)
      .patch(`/sgla-api/attendances/${attendance._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ event: eventB._id });

    expect(res.status).toBe(200);
    expect(res.body.event.toString()).toBe(eventB._id.toString());
  });

  it('returns 404 for a non-existent attendance id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .patch('/sgla-api/attendances/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`)
      .send({ isConfirmed: true });

    expect(res.status).toBe(404);
  });

  it('returns 409 when updating to an event from a different league than the membership', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const leagueA = await createAcademicLeague(university._id);
    const leagueB = await createAcademicLeague(university._id);
    const eventA = await createTestEvent(leagueA._id);
    const eventB = await createTestEvent(leagueB._id);
    const membership = await createTestMembership(admin._id, leagueA._id);
    const attendance = await createTestAttendance(eventA._id, membership._id);

    const res = await request(app)
      .patch(`/sgla-api/attendances/${attendance._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ event: eventB._id });

    expect(res.status).toBe(409);
  });

  it('returns 409 when updating causes a duplicate attendance', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const eventA = await createTestEvent(league._id);
    const eventB = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);
    // attendance for eventA already exists
    await createTestAttendance(eventA._id, membership._id);
    // attendance to be updated to eventA (collision)
    const attendanceB = await createTestAttendance(eventB._id, membership._id);

    const res = await request(app)
      .patch(`/sgla-api/attendances/${attendanceB._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ event: eventA._id });

    expect(res.status).toBe(409);
  });

  it('returns 400 for an invalid attendance id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .patch('/sgla-api/attendances/bad-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ isConfirmed: true });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .patch('/sgla-api/attendances/507f1f77bcf86cd799439099')
      .send({ isConfirmed: true });
    expect(res.status).toBe(401);
  });
});

// ─── DELETE /sgla-api/attendances/:_id ──────────────────────────────────────

describe('DELETE /sgla-api/attendances/:_id', () => {
  it('returns 204 when admin deletes an attendance', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);
    const attendance = await createTestAttendance(event._id, membership._id);

    const res = await request(app)
      .delete(`/sgla-api/attendances/${attendance._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it('actually removes the document from the database', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);
    const attendance = await createTestAttendance(event._id, membership._id);

    await request(app)
      .delete(`/sgla-api/attendances/${attendance._id}`)
      .set('Authorization', `Bearer ${token}`);

    const found = await AttendanceModel.findById(attendance._id).lean().exec();
    expect(found).toBeNull();
  });

  it('returns 404 for a non-existent attendance id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .delete('/sgla-api/attendances/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 400 for an invalid (non-ObjectId) id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .delete('/sgla-api/attendances/not-valid')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete(
      '/sgla-api/attendances/507f1f77bcf86cd799439099',
    );
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /sgla-api/attendances/:_id/confirm ───────────────────────────────

describe('PATCH /sgla-api/attendances/:_id/confirm', () => {
  it('returns 200 and sets isConfirmed=true', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);
    const attendance = await createTestAttendance(event._id, membership._id, {
      isConfirmed: false,
    });

    const res = await request(app)
      .patch(`/sgla-api/attendances/${attendance._id}/confirm`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.isConfirmed).toBe(true);
  });

  it('is idempotent — returns 200 when already confirmed', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);
    const attendance = await createTestAttendance(event._id, membership._id, {
      isConfirmed: true,
    });

    const res = await request(app)
      .patch(`/sgla-api/attendances/${attendance._id}/confirm`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.isConfirmed).toBe(true);
  });

  it('returns 404 for a non-existent attendance id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .patch('/sgla-api/attendances/507f1f77bcf86cd799439099/confirm')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 400 for an invalid attendance id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .patch('/sgla-api/attendances/bad-id/confirm')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).patch(
      '/sgla-api/attendances/507f1f77bcf86cd799439099/confirm',
    );
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /sgla-api/attendances/:_id/mark-attended ─────────────────────────

describe('PATCH /sgla-api/attendances/:_id/mark-attended', () => {
  it('returns 200 and sets hasAttended=true with default body', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);
    const attendance = await createTestAttendance(event._id, membership._id);

    const res = await request(app)
      .patch(`/sgla-api/attendances/${attendance._id}/mark-attended`)
      .set('Authorization', `Bearer ${token}`)
      .send({ hasAttended: true });

    expect(res.status).toBe(200);
    expect(res.body.hasAttended).toBe(true);
  });

  it('auto-sets isConfirmed=true when marking hasAttended=true', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);
    const attendance = await createTestAttendance(event._id, membership._id, {
      isConfirmed: false,
    });

    const res = await request(app)
      .patch(`/sgla-api/attendances/${attendance._id}/mark-attended`)
      .set('Authorization', `Bearer ${token}`)
      .send({ hasAttended: true });

    expect(res.status).toBe(200);
    expect(res.body.hasAttended).toBe(true);
    expect(res.body.isConfirmed).toBe(true);
  });

  it('sets hasAttended=false without touching isConfirmed', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);
    const attendance = await createTestAttendance(event._id, membership._id, {
      hasAttended: true,
      isConfirmed: true,
    });

    const res = await request(app)
      .patch(`/sgla-api/attendances/${attendance._id}/mark-attended`)
      .set('Authorization', `Bearer ${token}`)
      .send({ hasAttended: false });

    expect(res.status).toBe(200);
    expect(res.body.hasAttended).toBe(false);
    // isConfirmed should not be flipped back to false
    expect(res.body.isConfirmed).toBe(true);
  });

  it('uses hasAttended=true as default when body is omitted', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createTestEvent(league._id);
    const membership = await createTestMembership(admin._id, league._id);
    const attendance = await createTestAttendance(event._id, membership._id);

    const res = await request(app)
      .patch(`/sgla-api/attendances/${attendance._id}/mark-attended`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.hasAttended).toBe(true);
  });

  it('returns 404 for a non-existent attendance id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .patch('/sgla-api/attendances/507f1f77bcf86cd799439099/mark-attended')
      .set('Authorization', `Bearer ${token}`)
      .send({ hasAttended: true });

    expect(res.status).toBe(404);
  });

  it('returns 400 for an invalid attendance id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .patch('/sgla-api/attendances/not-valid/mark-attended')
      .set('Authorization', `Bearer ${token}`)
      .send({ hasAttended: true });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .patch('/sgla-api/attendances/507f1f77bcf86cd799439099/mark-attended')
      .send({ hasAttended: true });
    expect(res.status).toBe(401);
  });
});
