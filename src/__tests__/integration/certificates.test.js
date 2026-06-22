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
import CertificateModel from '../../models/CertificateModel.js';

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

async function createCertificate(membershipId, overrides = {}) {
  return CertificateModel.create({
    leagueMembership: membershipId,
    workLoadHours: 40,
    issueDate: new Date(),
    pdfUrl: 'https://cdn.test/certificate.pdf',
    ...overrides,
  });
}

// ─── GET /sgla-api/certificates ───────────────────────────────────────────────

describe('GET /sgla-api/certificates', () => {
  it('returns 200 with an array for admin', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .get('/sgla-api/certificates')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns the certificates belonging to a membership when filtered', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id);

    await createCertificate(membership._id, { workLoadHours: 20 });
    await createCertificate(membership._id, { workLoadHours: 30 });

    const res = await request(app)
      .get('/sgla-api/certificates')
      .query({ leagueMembership: membership._id.toString() })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    res.body.forEach((cert) => {
      expect(cert.leagueMembership.toString()).toBe(membership._id.toString());
    });
  });

  it('filters by issueDateFrom and issueDateTo', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id);

    const past = new Date('2020-01-01');
    const future = new Date('2030-12-31');
    await createCertificate(membership._id, { issueDate: past });
    await createCertificate(membership._id, { issueDate: future });

    const res = await request(app)
      .get('/sgla-api/certificates')
      .query({
        leagueMembership: membership._id.toString(),
        issueDateFrom: '2020-01-01',
        issueDateTo: '2021-01-01',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((cert) => {
      expect(new Date(cert.issueDate) >= new Date('2020-01-01')).toBe(true);
      expect(new Date(cert.issueDate) <= new Date('2021-01-01')).toBe(true);
    });
  });

  it('filters by minWorkLoadHours and maxWorkLoadHours', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id);

    await createCertificate(membership._id, { workLoadHours: 10 });
    await createCertificate(membership._id, { workLoadHours: 50 });
    await createCertificate(membership._id, { workLoadHours: 100 });

    const res = await request(app)
      .get('/sgla-api/certificates')
      .query({
        leagueMembership: membership._id.toString(),
        minWorkLoadHours: 40,
        maxWorkLoadHours: 60,
      })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((cert) => {
      expect(cert.workLoadHours).toBeGreaterThanOrEqual(40);
      expect(cert.workLoadHours).toBeLessThanOrEqual(60);
    });
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/sgla-api/certificates');
    expect(res.status).toBe(401);
  });
});

// ─── POST /sgla-api/certificates ──────────────────────────────────────────────

describe('POST /sgla-api/certificates', () => {
  it('returns 201 when creating a certificate with a pdfUrl', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id);

    const res = await request(app)
      .post('/sgla-api/certificates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        leagueMembership: membership._id.toString(),
        workLoadHours: 10,
        issueDate: new Date().toISOString(),
        pdfUrl: 'https://cdn.test/cert.pdf',
      });

    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.leagueMembership.toString()).toBe(
      membership._id.toString(),
    );
    expect(res.body.workLoadHours).toBe(10);
    expect(res.body.pdfUrl).toBe('https://cdn.test/cert.pdf');
  });

  it('returns 201 and generates a PDF via pdfkit + cloudinary when no pdfUrl is provided', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id);

    const res = await request(app)
      .post('/sgla-api/certificates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        leagueMembership: membership._id.toString(),
        workLoadHours: 20,
        issueDate: new Date().toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.pdfUrl).toBe('https://cdn.test/file.pdf');
  });

  it('returns 404 when leagueMembership does not exist', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .post('/sgla-api/certificates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        leagueMembership: '507f1f77bcf86cd799439099',
        workLoadHours: 10,
        issueDate: new Date().toISOString(),
        pdfUrl: 'https://cdn.test/cert.pdf',
      });

    expect(res.status).toBe(404);
  });

  it('returns 400 when required fields are missing', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .post('/sgla-api/certificates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        workLoadHours: 10,
      });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/sgla-api/certificates').send({
      leagueMembership: '507f1f77bcf86cd799439099',
      workLoadHours: 10,
      issueDate: new Date().toISOString(),
      pdfUrl: 'https://cdn.test/cert.pdf',
    });

    expect(res.status).toBe(401);
  });
});

// ─── GET /sgla-api/certificates/:_id ─────────────────────────────────────────

describe('GET /sgla-api/certificates/:_id', () => {
  it('returns 200 with the certificate for a valid id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id);
    const certificate = await createCertificate(membership._id);

    const res = await request(app)
      .get(`/sgla-api/certificates/${certificate._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(certificate._id.toString());
    expect(res.body.workLoadHours).toBe(40);
  });

  it('returns 404 for a non-existent certificate id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .get('/sgla-api/certificates/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get(
      '/sgla-api/certificates/507f1f77bcf86cd799439099',
    );
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /sgla-api/certificates/:_id ───────────────────────────────────────

describe('PATCH /sgla-api/certificates/:_id', () => {
  it('returns 200 when updating workLoadHours', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id);
    const certificate = await createCertificate(membership._id, {
      workLoadHours: 40,
    });

    const res = await request(app)
      .patch(`/sgla-api/certificates/${certificate._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ workLoadHours: 80 });

    expect(res.status).toBe(200);
    expect(res.body.workLoadHours).toBe(80);
  });

  it('returns 200 when updating pdfUrl', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id);
    const certificate = await createCertificate(membership._id);

    const res = await request(app)
      .patch(`/sgla-api/certificates/${certificate._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ pdfUrl: 'https://cdn.test/updated.pdf' });

    expect(res.status).toBe(200);
    expect(res.body.pdfUrl).toBe('https://cdn.test/updated.pdf');
  });

  it('returns 200 when updating leagueMembership to another valid membership', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership1 = await createMembership(user._id, league._id);
    const membership2 = await createMembership(user._id, league._id);
    const certificate = await createCertificate(membership1._id);

    const res = await request(app)
      .patch(`/sgla-api/certificates/${certificate._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ leagueMembership: membership2._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.leagueMembership.toString()).toBe(
      membership2._id.toString(),
    );
  });

  it('returns 404 when updating leagueMembership to a non-existent membership', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id);
    const certificate = await createCertificate(membership._id);

    const res = await request(app)
      .patch(`/sgla-api/certificates/${certificate._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ leagueMembership: '507f1f77bcf86cd799439099' });

    expect(res.status).toBe(404);
  });

  it('returns 404 for a non-existent certificate id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .patch('/sgla-api/certificates/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`)
      .send({ workLoadHours: 50 });

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .patch('/sgla-api/certificates/507f1f77bcf86cd799439099')
      .send({ workLoadHours: 50 });

    expect(res.status).toBe(401);
  });
});

// ─── DELETE /sgla-api/certificates/:_id ──────────────────────────────────────

describe('DELETE /sgla-api/certificates/:_id', () => {
  it('returns 204 when deleting an existing certificate', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id);
    const certificate = await createCertificate(membership._id);

    const res = await request(app)
      .delete(`/sgla-api/certificates/${certificate._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);

    const deleted = await CertificateModel.findById(certificate._id);
    expect(deleted).toBeNull();
  });

  it('returns 404 for a non-existent certificate id', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .delete('/sgla-api/certificates/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete(
      '/sgla-api/certificates/507f1f77bcf86cd799439099',
    );
    expect(res.status).toBe(401);
  });
});

// ─── GET /sgla-api/certificates/league-membership/:leagueMembership/latest ───

describe('GET /sgla-api/certificates/league-membership/:leagueMembership/latest', () => {
  it('returns 200 with the most recently issued certificate', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id);

    const older = new Date('2022-01-01');
    const newer = new Date('2024-06-01');
    await createCertificate(membership._id, { issueDate: older });
    const latest = await createCertificate(membership._id, {
      issueDate: newer,
    });

    const res = await request(app)
      .get(`/sgla-api/certificates/league-membership/${membership._id}/latest`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(latest._id.toString());
    expect(new Date(res.body.issueDate).toISOString()).toBe(
      newer.toISOString(),
    );
  });

  it('returns 404 when no certificate exists for the membership', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id);

    const res = await request(app)
      .get(`/sgla-api/certificates/league-membership/${membership._id}/latest`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 when the leagueMembership does not exist', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .get(
        '/sgla-api/certificates/league-membership/507f1f77bcf86cd799439099/latest',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get(
      '/sgla-api/certificates/league-membership/507f1f77bcf86cd799439099/latest',
    );
    expect(res.status).toBe(401);
  });
});

// ─── GET /sgla-api/certificates/league-membership/:leagueMembership/summary ──

describe('GET /sgla-api/certificates/league-membership/:leagueMembership/summary', () => {
  it('returns 200 with summary when membership has certificates', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id);

    await createCertificate(membership._id, { workLoadHours: 30 });
    await createCertificate(membership._id, { workLoadHours: 20 });

    const res = await request(app)
      .get(`/sgla-api/certificates/league-membership/${membership._id}/summary`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.leagueMembership.toString()).toBe(
      membership._id.toString(),
    );
    expect(res.body.certificatesIssued).toBe(2);
    expect(res.body.totalWorkLoadHours).toBe(50);
    expect(typeof res.body.confirmedEvents).toBe('number');
    expect(typeof res.body.attendedEvents).toBe('number');
  });

  it('returns 200 with zeroed counts when membership has no certificates', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const user = await createUser();
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const membership = await createMembership(user._id, league._id);

    const res = await request(app)
      .get(`/sgla-api/certificates/league-membership/${membership._id}/summary`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.certificatesIssued).toBe(0);
    expect(res.body.totalWorkLoadHours).toBe(0);
  });

  it('returns 404 when leagueMembership does not exist', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);

    const res = await request(app)
      .get(
        '/sgla-api/certificates/league-membership/507f1f77bcf86cd799439099/summary',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get(
      '/sgla-api/certificates/league-membership/507f1f77bcf86cd799439099/summary',
    );
    expect(res.status).toBe(401);
  });
});
