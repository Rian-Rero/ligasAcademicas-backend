import { describe, expect, it } from 'vitest';

import {
  AppError,
  BadRequest,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../../errors/baseErrors.js';

describe('AppError', () => {
  it('extends Error', () => {
    const err = new AppError('TestName', 400, 'test message', true);
    expect(err).toBeInstanceOf(Error);
  });

  it('sets name, httpCode, message, and isOperational', () => {
    const err = new AppError('MyError', 418, 'I am a teapot', true);
    expect(err.name).toBe('MyError');
    expect(err.httpCode).toBe(418);
    expect(err.message).toBe('I am a teapot');
    expect(err.isOperational).toBe(true);
  });
});

describe('UnauthorizedError', () => {
  it('has httpCode 401', () => {
    expect(new UnauthorizedError('msg').httpCode).toBe(401);
  });

  it('has name "Unauthorized"', () => {
    expect(new UnauthorizedError('msg').name).toBe('Unauthorized');
  });

  it('is operational', () => {
    expect(new UnauthorizedError('msg').isOperational).toBe(true);
  });
});

describe('ForbiddenError', () => {
  it('has httpCode 403', () => {
    expect(new ForbiddenError('msg').httpCode).toBe(403);
  });

  it('has name "Forbidden"', () => {
    expect(new ForbiddenError('msg').name).toBe('Forbidden');
  });
});

describe('NotFoundError', () => {
  it('has httpCode 404', () => {
    expect(new NotFoundError('msg').httpCode).toBe(404);
  });

  it('has name "NotFound"', () => {
    expect(new NotFoundError('msg').name).toBe('NotFound');
  });
});

describe('ConflictError', () => {
  it('has httpCode 409', () => {
    expect(new ConflictError('msg').httpCode).toBe(409);
  });

  it('uses ValidationError name (as per implementation)', () => {
    expect(new ConflictError('msg').name).toBe('ValidationError');
  });
});

describe('BadRequest', () => {
  it('has httpCode 400', () => {
    expect(new BadRequest('msg').httpCode).toBe(400);
  });

  it('has name "BadRequest"', () => {
    expect(new BadRequest('msg').name).toBe('BadRequest');
  });
});

describe('ValidationError', () => {
  it('has httpCode 403', () => {
    expect(new ValidationError('msg').httpCode).toBe(403);
  });
});

describe('InternalServerError', () => {
  it('has httpCode 500', () => {
    expect(new InternalServerError().httpCode).toBe(500);
  });

  it('is NOT operational', () => {
    expect(new InternalServerError().isOperational).toBe(false);
  });

  it('uses a default message when none provided', () => {
    expect(new InternalServerError().message).toBe('Something went wrong');
  });

  it('accepts a custom message', () => {
    expect(new InternalServerError('custom').message).toBe('custom');
  });
});
