import { describe, expect, it, vi } from 'vitest';

import { BadRequest, NotFoundError } from '../../../errors/baseErrors.js';
import TaskModel from '../../../models/TaskModel.js';
import * as TaskService from '../../../services/TaskService.js';
import { createUser } from '../../helpers/factories.js';

vi.mock('../../../mail/handlers.js', () => ({
  taskDelegated: vi.fn().mockResolvedValue(true),
  taskCompleted: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../../services/GoogleCalendarService.js', () => ({
  createGoogleCalendarEvent: vi
    .fn()
    .mockResolvedValue({
      googleEventId: 'gc-event-id',
      refreshedTokenData: null,
    }),
  deleteGoogleCalendarEvent: vi
    .fn()
    .mockResolvedValue({ refreshedTokenData: null }),
}));

// Helper to create a task directly in the DB
async function createTask(assignedTo, assignedBy, overrides = {}) {
  return TaskModel.create({
    title: 'Test Task',
    description: 'Test description',
    dueDate: new Date('2026-12-31'),
    assignedTo,
    assignedBy,
    ...overrides,
  });
}

// ─── get ─────────────────────────────────────────────────────────────────────

describe('TaskService.get', () => {
  it('returns all tasks when no filters are provided', async () => {
    const userA = await createUser();
    const userB = await createUser();
    await createTask(userA._id, userB._id, { title: 'Task A' });
    await createTask(userB._id, userA._id, { title: 'Task B' });

    const tasks = await TaskService.get({});
    expect(tasks.length).toBe(2);
  });

  it('filters by assignedTo', async () => {
    const userA = await createUser();
    const userB = await createUser();
    await createTask(userA._id, userB._id, { title: 'For A' });
    await createTask(userB._id, userA._id, { title: 'For B' });

    const tasks = await TaskService.get({ assignedTo: userA._id });
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('For A');
  });

  it('filters by completed=true', async () => {
    const userA = await createUser();
    const userB = await createUser();
    await createTask(userA._id, userB._id, {
      title: 'Pending',
      completed: false,
    });
    await createTask(userA._id, userB._id, {
      title: 'Done',
      completed: true,
      completedAt: new Date(),
    });

    const tasks = await TaskService.get({ completed: true });
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Done');
  });

  it('filters by completed=false', async () => {
    const userA = await createUser();
    const userB = await createUser();
    await createTask(userA._id, userB._id, {
      title: 'Pending',
      completed: false,
    });
    await createTask(userA._id, userB._id, {
      title: 'Done',
      completed: true,
      completedAt: new Date(),
    });

    const tasks = await TaskService.get({ completed: false });
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Pending');
  });

  it('filters by dueDateAfter', async () => {
    const userA = await createUser();
    const userB = await createUser();
    await createTask(userA._id, userB._id, {
      title: 'Old task',
      dueDate: new Date('2025-01-01'),
    });
    await createTask(userA._id, userB._id, {
      title: 'New task',
      dueDate: new Date('2027-06-01'),
    });

    const tasks = await TaskService.get({
      dueDateAfter: new Date('2026-01-01'),
    });
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('New task');
  });

  it('filters by dueDateBefore', async () => {
    const userA = await createUser();
    const userB = await createUser();
    await createTask(userA._id, userB._id, {
      title: 'Old task',
      dueDate: new Date('2025-01-01'),
    });
    await createTask(userA._id, userB._id, {
      title: 'New task',
      dueDate: new Date('2027-06-01'),
    });

    const tasks = await TaskService.get({
      dueDateBefore: new Date('2026-01-01'),
    });
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Old task');
  });

  it('filters by dueDateAfter and dueDateBefore together', async () => {
    const userA = await createUser();
    const userB = await createUser();
    await createTask(userA._id, userB._id, {
      title: 'Too early',
      dueDate: new Date('2024-01-01'),
    });
    await createTask(userA._id, userB._id, {
      title: 'In range',
      dueDate: new Date('2026-06-15'),
    });
    await createTask(userA._id, userB._id, {
      title: 'Too late',
      dueDate: new Date('2028-01-01'),
    });

    const tasks = await TaskService.get({
      dueDateAfter: new Date('2026-01-01'),
      dueDateBefore: new Date('2027-01-01'),
    });
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('In range');
  });

  it('returns tasks sorted by dueDate ascending', async () => {
    const userA = await createUser();
    const userB = await createUser();
    await createTask(userA._id, userB._id, {
      title: 'Later',
      dueDate: new Date('2027-01-01'),
    });
    await createTask(userA._id, userB._id, {
      title: 'Earlier',
      dueDate: new Date('2026-01-01'),
    });

    const tasks = await TaskService.get({});
    expect(tasks[0].title).toBe('Earlier');
    expect(tasks[1].title).toBe('Later');
  });

  it('returns empty array when no tasks match filters', async () => {
    const tasks = await TaskService.get({ completed: true });
    expect(tasks).toEqual([]);
  });
});

// ─── getById ─────────────────────────────────────────────────────────────────

describe('TaskService.getById', () => {
  it('returns the task when it exists', async () => {
    const userA = await createUser();
    const userB = await createUser();
    const task = await createTask(userA._id, userB._id, { title: 'Find me' });

    const found = await TaskService.getById(task._id.toString());
    expect(found).toBeDefined();
    expect(found._id.toString()).toBe(task._id.toString());
    expect(found.title).toBe('Find me');
  });

  it('throws NotFoundError for a non-existent id', async () => {
    await expect(
      TaskService.getById('507f1f77bcf86cd799439011'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

// ─── create ──────────────────────────────────────────────────────────────────

describe('TaskService.create', () => {
  it('creates a task and sets assignedBy to actorUserId', async () => {
    const actor = await createUser();
    const assignee = await createUser();

    const task = await TaskService.create({
      inputData: {
        title: 'New Task',
        description: 'Do something',
        dueDate: new Date('2026-12-01'),
        assignedTo: assignee._id.toString(),
      },
      actorUserId: actor._id.toString(),
    });

    expect(task).toBeDefined();
    expect(task.title).toBe('New Task');
    expect(task.assignedBy.toString()).toBe(actor._id.toString());
    expect(task.assignedTo.toString()).toBe(assignee._id.toString());
  });

  it('throws NotFoundError when assignedTo user does not exist', async () => {
    const actor = await createUser();

    await expect(
      TaskService.create({
        inputData: {
          title: 'Bad Task',
          description: 'No assignee',
          dueDate: new Date('2026-12-01'),
          assignedTo: '507f1f77bcf86cd799439011',
        },
        actorUserId: actor._id.toString(),
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('sends a taskDelegated email notification after creation', async () => {
    const { taskDelegated } = await import('../../../mail/handlers.js');
    vi.clearAllMocks();

    const actor = await createUser();
    const assignee = await createUser();

    await TaskService.create({
      inputData: {
        title: 'Email Task',
        description: 'Send an email',
        dueDate: new Date('2026-12-01'),
        assignedTo: assignee._id.toString(),
      },
      actorUserId: actor._id.toString(),
    });

    expect(taskDelegated).toHaveBeenCalledTimes(1);
    expect(taskDelegated).toHaveBeenCalledWith(
      expect.objectContaining({
        assignee: expect.objectContaining({ _id: assignee._id }),
        task: expect.objectContaining({ title: 'Email Task' }),
      }),
    );
  });

  it('persists the new task in the database', async () => {
    const actor = await createUser();
    const assignee = await createUser();

    const task = await TaskService.create({
      inputData: {
        title: 'Persist Test',
        description: 'Should be saved',
        dueDate: new Date('2026-12-01'),
        assignedTo: assignee._id.toString(),
      },
      actorUserId: actor._id.toString(),
    });

    const found = await TaskModel.findById(task._id).lean().exec();
    expect(found).not.toBeNull();
    expect(found.title).toBe('Persist Test');
  });

  it('creates Google Calendar event when user has google linked', async () => {
    const { createGoogleCalendarEvent } =
      await import('../../../services/GoogleCalendarService.js');
    vi.clearAllMocks();

    const actor = await createUser();
    const assignee = await createUser({
      googleCalendarLinked: true,
      googleCalendarRefreshToken: 'refresh-token',
      googleCalendarAccessToken: 'access-token',
      googleCalendarTokenExpiryDate: new Date('2030-01-01'),
      googleCalendarScope: 'https://www.googleapis.com/auth/calendar',
    });

    await TaskService.create({
      inputData: {
        title: 'Calendar Task',
        description: 'Add to calendar',
        dueDate: new Date('2026-12-01'),
        assignedTo: assignee._id.toString(),
      },
      actorUserId: actor._id.toString(),
    });

    expect(createGoogleCalendarEvent).toHaveBeenCalledTimes(1);
  });

  it('does not create Google Calendar event when user has no google linked', async () => {
    const { createGoogleCalendarEvent } =
      await import('../../../services/GoogleCalendarService.js');
    vi.clearAllMocks();

    const actor = await createUser();
    const assignee = await createUser({ googleCalendarLinked: false });

    await TaskService.create({
      inputData: {
        title: 'No Calendar Task',
        description: 'No calendar',
        dueDate: new Date('2026-12-01'),
        assignedTo: assignee._id.toString(),
      },
      actorUserId: actor._id.toString(),
    });

    expect(createGoogleCalendarEvent).not.toHaveBeenCalled();
  });

  it('stores googleCalendarEventId on task after successful calendar creation', async () => {
    vi.clearAllMocks();

    const actor = await createUser();
    const assignee = await createUser({
      googleCalendarLinked: true,
      googleCalendarRefreshToken: 'refresh-token',
      googleCalendarAccessToken: 'access-token',
      googleCalendarTokenExpiryDate: new Date('2030-01-01'),
      googleCalendarScope: 'https://www.googleapis.com/auth/calendar',
    });

    const task = await TaskService.create({
      inputData: {
        title: 'Calendar ID Task',
        description: 'Store event id',
        dueDate: new Date('2026-12-01'),
        assignedTo: assignee._id.toString(),
      },
      actorUserId: actor._id.toString(),
    });

    const persisted = await TaskModel.findById(task._id).lean().exec();
    expect(persisted.googleCalendarEventId).toBe('gc-event-id');
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe('TaskService.update', () => {
  it('updates the task when actor is the assignedBy user', async () => {
    const actor = await createUser();
    const assignee = await createUser();
    const task = await createTask(assignee._id, actor._id);

    const updated = await TaskService.update({
      _id: task._id.toString(),
      inputData: { title: 'Updated Title' },
      actorUserId: actor._id.toString(),
    });

    expect(updated.title).toBe('Updated Title');
  });

  it('updates the task when actor is the assignedTo user', async () => {
    const creator = await createUser();
    const assignee = await createUser();
    const task = await createTask(assignee._id, creator._id);

    const updated = await TaskService.update({
      _id: task._id.toString(),
      inputData: { description: 'Updated description' },
      actorUserId: assignee._id.toString(),
    });

    expect(updated.description).toBe('Updated description');
  });

  it('throws NotFoundError when task does not exist', async () => {
    const actor = await createUser();

    await expect(
      TaskService.update({
        _id: '507f1f77bcf86cd799439011',
        inputData: { title: 'Should fail' },
        actorUserId: actor._id.toString(),
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws BadRequest when actor is neither assignedBy nor assignedTo', async () => {
    const creator = await createUser();
    const assignee = await createUser();
    const unrelated = await createUser();
    const task = await createTask(assignee._id, creator._id);

    await expect(
      TaskService.update({
        _id: task._id.toString(),
        inputData: { title: 'Unauthorized update' },
        actorUserId: unrelated._id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequest);
  });

  it('persists changes in the database', async () => {
    const actor = await createUser();
    const assignee = await createUser();
    const task = await createTask(assignee._id, actor._id);

    await TaskService.update({
      _id: task._id.toString(),
      inputData: { title: 'Persisted Update', priority: 'HIGH' },
      actorUserId: actor._id.toString(),
    });

    const found = await TaskModel.findById(task._id).lean().exec();
    expect(found.title).toBe('Persisted Update');
    expect(found.priority).toBe('HIGH');
  });
});

// ─── completeTask ─────────────────────────────────────────────────────────────

describe('TaskService.completeTask', () => {
  it('marks the task as completed when actor is the assignedTo user', async () => {
    const creator = await createUser();
    const assignee = await createUser();
    const task = await createTask(assignee._id, creator._id);

    const result = await TaskService.completeTask({
      _id: task._id.toString(),
      actorUserId: assignee._id.toString(),
    });

    expect(result.completed).toBe(true);
    expect(result.completedAt).toBeDefined();
  });

  it('throws NotFoundError when task does not exist', async () => {
    const actor = await createUser();

    await expect(
      TaskService.completeTask({
        _id: '507f1f77bcf86cd799439011',
        actorUserId: actor._id.toString(),
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws BadRequest when actor is not the assignedTo user', async () => {
    const creator = await createUser();
    const assignee = await createUser();
    const unrelated = await createUser();
    const task = await createTask(assignee._id, creator._id);

    await expect(
      TaskService.completeTask({
        _id: task._id.toString(),
        actorUserId: unrelated._id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequest);
  });

  it('throws BadRequest when the assignedBy user tries to complete the task', async () => {
    const creator = await createUser();
    const assignee = await createUser();
    const task = await createTask(assignee._id, creator._id);

    await expect(
      TaskService.completeTask({
        _id: task._id.toString(),
        actorUserId: creator._id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequest);
  });

  it('sends a taskCompleted email notification', async () => {
    const { taskCompleted } = await import('../../../mail/handlers.js');
    vi.clearAllMocks();

    const creator = await createUser();
    const assignee = await createUser();
    const task = await createTask(assignee._id, creator._id);

    await TaskService.completeTask({
      _id: task._id.toString(),
      actorUserId: assignee._id.toString(),
    });

    expect(taskCompleted).toHaveBeenCalledTimes(1);
    expect(taskCompleted).toHaveBeenCalledWith(
      expect.objectContaining({
        assigner: expect.objectContaining({ _id: creator._id }),
        assignee: expect.objectContaining({ _id: assignee._id }),
        task: expect.objectContaining({ _id: task._id }),
      }),
    );
  });

  it('persists completed=true and completedAt in the database', async () => {
    const creator = await createUser();
    const assignee = await createUser();
    const task = await createTask(assignee._id, creator._id);

    await TaskService.completeTask({
      _id: task._id.toString(),
      actorUserId: assignee._id.toString(),
    });

    const found = await TaskModel.findById(task._id).lean().exec();
    expect(found.completed).toBe(true);
    expect(found.completedAt).toBeInstanceOf(Date);
  });
});

// ─── destroy ─────────────────────────────────────────────────────────────────

describe('TaskService.destroy', () => {
  it('deletes the task when actor is the assignedBy user', async () => {
    const creator = await createUser();
    const assignee = await createUser();
    const task = await createTask(assignee._id, creator._id);

    await TaskService.destroy({
      _id: task._id.toString(),
      actorUserId: creator._id.toString(),
    });

    const found = await TaskModel.findById(task._id).lean().exec();
    expect(found).toBeNull();
  });

  it('throws NotFoundError when task does not exist', async () => {
    const actor = await createUser();

    await expect(
      TaskService.destroy({
        _id: '507f1f77bcf86cd799439011',
        actorUserId: actor._id.toString(),
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws BadRequest when actor is not the assignedBy user', async () => {
    const creator = await createUser();
    const assignee = await createUser();
    const unrelated = await createUser();
    const task = await createTask(assignee._id, creator._id);

    await expect(
      TaskService.destroy({
        _id: task._id.toString(),
        actorUserId: unrelated._id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequest);
  });

  it('throws BadRequest when the assignedTo user tries to delete the task', async () => {
    const creator = await createUser();
    const assignee = await createUser();
    const task = await createTask(assignee._id, creator._id);

    await expect(
      TaskService.destroy({
        _id: task._id.toString(),
        actorUserId: assignee._id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequest);
  });

  it('deletes the Google Calendar event when task has one', async () => {
    const { deleteGoogleCalendarEvent } =
      await import('../../../services/GoogleCalendarService.js');
    vi.clearAllMocks();

    const creator = await createUser();
    const assignee = await createUser({
      googleCalendarLinked: true,
      googleCalendarRefreshToken: 'refresh-token',
      googleCalendarAccessToken: 'access-token',
      googleCalendarTokenExpiryDate: new Date('2030-01-01'),
      googleCalendarScope: 'https://www.googleapis.com/auth/calendar',
    });
    const task = await createTask(assignee._id, creator._id, {
      googleCalendarEventId: 'existing-gc-event',
    });

    await TaskService.destroy({
      _id: task._id.toString(),
      actorUserId: creator._id.toString(),
    });

    expect(deleteGoogleCalendarEvent).toHaveBeenCalledTimes(1);
    expect(deleteGoogleCalendarEvent).toHaveBeenCalledWith(
      expect.objectContaining({ googleEventId: 'existing-gc-event' }),
    );
  });

  it('does not attempt to delete Google Calendar event when task has none', async () => {
    const { deleteGoogleCalendarEvent } =
      await import('../../../services/GoogleCalendarService.js');
    vi.clearAllMocks();

    const creator = await createUser();
    const assignee = await createUser();
    const task = await createTask(assignee._id, creator._id);

    await TaskService.destroy({
      _id: task._id.toString(),
      actorUserId: creator._id.toString(),
    });

    expect(deleteGoogleCalendarEvent).not.toHaveBeenCalled();
  });
});
