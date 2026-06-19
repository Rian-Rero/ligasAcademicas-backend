import multer from 'multer';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';

import {
  BadRequest,
  ConflictError,
  ForbiddenError,
  InternalServerError,
} from '../../../../errors/baseErrors.js';
import handler from '../../../../errors/handlers/handler.js';

describe('handler (centralized error mapper)', () => {
  it('passes through AppError instances unchanged', () => {
    const err = new BadRequest('bad input');
    expect(handler(err)).toBe(err);
  });

  it('converts multer.MulterError to BadRequest', () => {
    const err = new multer.MulterError('LIMIT_FILE_SIZE');
    const result = handler(err);
    expect(result).toBeInstanceOf(BadRequest);
  });

  it('converts Mongoose ValidationError to BadRequest', () => {
    const err = {
      name: 'ValidationError',
      errors: { field: { message: 'required' } },
    };
    const result = handler(err);
    expect(result).toBeInstanceOf(BadRequest);
  });

  it('converts Mongo duplicate key error (11000) to ConflictError', () => {
    const err = {
      name: 'MongoServerError',
      code: 11000,
      keyValue: { email: 'x@x.com' },
    };
    const result = handler(err);
    expect(result).toBeInstanceOf(ConflictError);
  });

  it('converts JsonWebTokenError to ForbiddenError', () => {
    const err = { name: 'JsonWebTokenError' };
    const result = handler(err);
    expect(result).toBeInstanceOf(ForbiddenError);
    expect(result.message).toBe('Invalid JWT token');
  });

  it('converts TokenExpiredError to ForbiddenError', () => {
    const err = { name: 'TokenExpiredError' };
    const result = handler(err);
    expect(result).toBeInstanceOf(ForbiddenError);
    expect(result.message).toBe('JWT token expired');
  });

  it('converts ZodError to BadRequest', () => {
    let zodErr;
    try {
      z.string().parse(123);
    } catch (e) {
      zodErr = e;
    }
    const result = handler(zodErr);
    expect(result).toBeInstanceOf(BadRequest);
  });

  it('converts unknown errors to InternalServerError', () => {
    const err = new Error('something weird');
    const result = handler(err);
    expect(result).toBeInstanceOf(InternalServerError);
    expect(result.message).toBe('something weird');
  });
});
