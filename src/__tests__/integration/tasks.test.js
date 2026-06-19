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
import { createAdminUser, createUser } from '../helpers/factories.js';
import TaskModel from '../../models/TaskModel.js';

async function loginUser(user) {
  user.password = 'Password@1';
  user.emailVerified = true;
  await user.save();
  const res = await request(app)
    .post('/sgla-api/login')
    .send({ email: user.email, password: 'Password@1' });
  return res.body.accessToken;
}

async function createTask(assignedToId, assignedById) {
  return TaskModel.create({
    title: 'Tarefa Teste',
    description: 'Descrição da tarefa teste',
    dueDate: new Date(Date.now() + 86400000),
    assignedTo: assignedToId,
    assignedBy: assignedById,
    priority: 'MEDIUM',
  });
}

describe('GET /sgla-api/tasks', () => {
  it('returns 200 with array for admin', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .get('/sgla-api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/sgla-api/tasks');
    expect(res.status).toBe(401);
  });
});

describe('POST /sgla-api/tasks', () => {
  it('returns 201 when admin creates a task', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const assignee = await createUser();
    const res = await request(app)
      .post('/sgla-api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Preparar relatório',
        description: 'Preparar relatório mensal de atividades',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        assignedTo: assignee._id,
        priority: 'HIGH',
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Preparar relatório');
  });

  it('returns 400 when required fields are missing', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .post('/sgla-api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Sem campos obrigatórios' });
    expect(res.status).toBe(400);
  });
});

describe('GET /sgla-api/tasks/:_id', () => {
  it('returns 200 for a valid task', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const assignee = await createUser();
    const task = await createTask(assignee._id, admin._id);
    const res = await request(app)
      .get(`/sgla-api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(task._id.toString());
  });

  it('returns 404 for non-existent task', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const res = await request(app)
      .get('/sgla-api/tasks/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /sgla-api/tasks/:_id', () => {
  it('returns 200 when admin updates a task', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const assignee = await createUser();
    const task = await createTask(assignee._id, admin._id);
    const res = await request(app)
      .patch(`/sgla-api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Título Atualizado' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Título Atualizado');
  });
});

describe('PATCH /sgla-api/tasks/:_id/complete', () => {
  it('returns 200 when the assigned user completes the task', async () => {
    const admin = await createAdminUser();
    const assignee = await createAdminUser();
    const token = await loginUser(assignee);
    const task = await createTask(assignee._id, admin._id);
    const res = await request(app)
      .patch(`/sgla-api/tasks/${task._id}/complete`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it('returns 400 when another user tries to complete the task', async () => {
    const admin = await createAdminUser();
    const assignee = await createUser();
    const otherAdmin = await createAdminUser();
    const token = await loginUser(otherAdmin);
    const task = await createTask(assignee._id, admin._id);
    const res = await request(app)
      .patch(`/sgla-api/tasks/${task._id}/complete`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

describe('DELETE /sgla-api/tasks/:_id', () => {
  it('returns 204 when admin deletes a task', async () => {
    const admin = await createAdminUser();
    const token = await loginUser(admin);
    const assignee = await createUser();
    const task = await createTask(assignee._id, admin._id);
    const res = await request(app)
      .delete(`/sgla-api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});
