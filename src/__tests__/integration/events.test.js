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
  createEvent: vi.fn().mockResolvedValue({ id: 'google-event-id' }),
  updateEvent: vi.fn().mockResolvedValue(true),
  deleteEvent: vi.fn().mockResolvedValue(true),
}));

import app from '../../app.js';
import {
  createAdminUser,
  createAcademicLeague,
  createUniversity,
} from '../helpers/factories.js';
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

async function createEvent(academicLeagueId) {
  return EventModel.create({
    academicLeague: academicLeagueId,
    title: 'Evento Teste',
    description: 'Descrição do evento teste',
    dateTime: new Date(Date.now() + 86400000),
    location: 'Auditório Central',
  });
}

describe('GET /sgla-api/events', () => {
  it('returns 200 with array for admin', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .get('/sgla-api/events')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/sgla-api/events');
    expect(res.status).toBe(401);
  });
});

describe('POST /sgla-api/events', () => {
  it('returns 201 when admin creates an event', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const res = await request(app)
      .post('/sgla-api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        academicLeague: league._id,
        title: 'Evento de Cardiologia',
        description: 'Estudo aprofundado do coração',
        dateTime: new Date(Date.now() + 86400000).toISOString(),
        location: 'Auditório A',
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Evento de Cardiologia');
  });

  it('returns 400 when title is missing', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const res = await request(app)
      .post('/sgla-api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        academicLeague: league._id,
        description: 'Sem título',
        dateTime: new Date().toISOString(),
        location: 'Auditório',
      });
    expect(res.status).toBe(400);
  });
});

describe('GET /sgla-api/events/:_id', () => {
  it('returns 200 for a valid event', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createEvent(league._id);
    const res = await request(app)
      .get(`/sgla-api/events/${event._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(event._id.toString());
  });

  it('returns 404 for non-existent event', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .get('/sgla-api/events/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /sgla-api/events/:_id', () => {
  it('returns 200 when admin updates an event', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createEvent(league._id);
    const res = await request(app)
      .patch(`/sgla-api/events/${event._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Título Atualizado' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Título Atualizado');
  });
});

describe('DELETE /sgla-api/events/:_id', () => {
  it('returns 204 when admin deletes an event', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const university = await createUniversity();
    const league = await createAcademicLeague(university._id);
    const event = await createEvent(league._id);
    const res = await request(app)
      .delete(`/sgla-api/events/${event._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 for non-existent event', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .delete('/sgla-api/events/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
