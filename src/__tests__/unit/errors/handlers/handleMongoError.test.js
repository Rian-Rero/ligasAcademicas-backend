import { describe, expect, it } from 'vitest';

import { BadRequest, ConflictError } from '../../../../errors/baseErrors.js';
import {
  handleMongoError,
  isMongoError,
} from '../../../../errors/handlers/handleMongoError.js';

describe('isMongoError', () => {
  it('returns true for Mongoose ValidationError', () => {
    expect(isMongoError({ name: 'ValidationError' })).toBe(true);
  });

  it('returns true for duplicate key error (code 11000)', () => {
    expect(isMongoError({ code: 11000, name: 'MongoServerError' })).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isMongoError({ name: 'OtherError', code: 500 })).toBe(false);
  });
});

describe('handleMongoError', () => {
  it('returns BadRequest for Mongoose ValidationError', () => {
    const err = {
      name: 'ValidationError',
      errors: {
        email: { message: 'email is required' },
      },
    };
    const result = handleMongoError(err);
    expect(result).toBeInstanceOf(BadRequest);
    expect(result.message).toContain('email is required');
  });

  it('returns ConflictError for duplicate key error (11000)', () => {
    const err = {
      name: 'MongoServerError',
      code: 11000,
      keyValue: { email: 'dup@test.com' },
    };
    const result = handleMongoError(err);
    expect(result).toBeInstanceOf(ConflictError);
    expect(result.message).toContain('dup@test.com');
  });

  it('returns BadRequest for other mongo errors', () => {
    const err = { name: 'ValidationError', errors: {} };
    const result = handleMongoError(err);
    expect(result).toBeInstanceOf(BadRequest);
  });
});
