import { describe, expect, it } from 'vitest';

import * as TaskValidator from '../../../validators/TaskValidator.js';

const VALID_OID = '507f1f77bcf86cd799439011';

function req(overrides = {}) {
  return { body: {}, params: {}, query: {}, signedCookies: {}, ...overrides };
}

const validCreate = {
  title: 'Preparar apresentação',
  description: 'Criar slides para a reunião',
  dueDate: new Date(Date.now() + 86400000).toISOString(),
  assignedTo: VALID_OID,
};

describe('TaskValidator.get', () => {
  it('accepts empty query', () => {
    expect(() => TaskValidator.get(req())).not.toThrow();
  });

  it('accepts optional filters', () => {
    expect(() =>
      TaskValidator.get(
        req({ query: { priority: 'HIGH', completed: 'false' } }),
      ),
    ).not.toThrow();
  });
});

describe('TaskValidator.getById', () => {
  it('accepts valid ObjectId', () => {
    expect(() =>
      TaskValidator.getById(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('throws for invalid ObjectId', () => {
    expect(() =>
      TaskValidator.getById(req({ params: { _id: 'bad' } })),
    ).toThrow();
  });
});

describe('TaskValidator.create', () => {
  it('accepts valid task data', () => {
    expect(() =>
      TaskValidator.create(req({ body: validCreate })),
    ).not.toThrow();
  });

  it('throws when title is missing', () => {
    const { title: _, ...rest } = validCreate;
    expect(() => TaskValidator.create(req({ body: rest }))).toThrow();
  });

  it('throws when title is too short', () => {
    expect(() =>
      TaskValidator.create(req({ body: { ...validCreate, title: 'AB' } })),
    ).toThrow();
  });

  it('throws when description is missing', () => {
    const { description: _, ...rest } = validCreate;
    expect(() => TaskValidator.create(req({ body: rest }))).toThrow();
  });

  it('throws when dueDate is missing', () => {
    const { dueDate: _, ...rest } = validCreate;
    expect(() => TaskValidator.create(req({ body: rest }))).toThrow();
  });

  it('throws when assignedTo is missing', () => {
    const { assignedTo: _, ...rest } = validCreate;
    expect(() => TaskValidator.create(req({ body: rest }))).toThrow();
  });

  it('accepts optional priority values', () => {
    expect(() =>
      TaskValidator.create(req({ body: { ...validCreate, priority: 'LOW' } })),
    ).not.toThrow();
  });
});

describe('TaskValidator.update', () => {
  it('accepts empty body with valid _id', () => {
    expect(() =>
      TaskValidator.update(req({ body: {}, params: { _id: VALID_OID } })),
    ).not.toThrow();
  });

  it('accepts partial update', () => {
    expect(() =>
      TaskValidator.update(
        req({ body: { completed: true }, params: { _id: VALID_OID } }),
      ),
    ).not.toThrow();
  });

  it('throws when _id is invalid', () => {
    expect(() =>
      TaskValidator.update(req({ body: {}, params: { _id: 'bad' } })),
    ).toThrow();
  });
});

describe('TaskValidator.destroy', () => {
  it('accepts valid _id', () => {
    expect(() =>
      TaskValidator.destroy(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });
});

describe('TaskValidator.completeTask', () => {
  it('accepts valid _id', () => {
    expect(() =>
      TaskValidator.completeTask(req({ params: { _id: VALID_OID } })),
    ).not.toThrow();
  });
});
