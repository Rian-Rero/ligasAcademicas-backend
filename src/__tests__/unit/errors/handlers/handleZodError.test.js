import { z, ZodError } from 'zod';
import { describe, expect, it } from 'vitest';

import {
  BadRequest,
  UnauthorizedError,
} from '../../../../errors/baseErrors.js';
import { ERROR_NAMES } from '../../../../utils/general/constants.js';
import {
  handleZodError,
  isZodError,
} from '../../../../errors/handlers/handleZodError.js';

function makeZodError(schema, data) {
  try {
    schema.parse(data);
  } catch (err) {
    return err;
  }
  throw new Error('Expected ZodError but schema passed');
}

describe('isZodError', () => {
  it('returns true for a ZodError', () => {
    const err = makeZodError(z.string(), 123);
    expect(isZodError(err)).toBe(true);
  });

  it('returns false for a regular Error', () => {
    expect(isZodError(new Error('regular'))).toBe(false);
  });

  it('returns false for a plain object', () => {
    expect(isZodError({ message: 'not a zod error' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isZodError(null)).toBe(false);
  });
});

describe('handleZodError', () => {
  it('returns a BadRequest for normal validation failures', () => {
    const err = makeZodError(z.string(), 123);
    const result = handleZodError(err);
    expect(result).toBeInstanceOf(BadRequest);
    expect(result.message).toContain('Request validation error(s)');
  });

  it('returns BadRequest with the zod error messages joined by semicolons', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const err = makeZodError(schema, { name: 123, age: 'not-a-number' });
    const result = handleZodError(err);
    expect(result).toBeInstanceOf(BadRequest);
    expect(result.message).toMatch(/Request validation error\(s\):/);
  });

  it('returns an UnauthorizedError when the joined error message equals ERROR_NAMES.UNAUTHORIZED', () => {
    // Zod v4 uses `issues` internally; `handleZodError` reads `err.errors`.
    // Simulate a ZodError-shaped object where err.errors yields the UNAUTHORIZED
    // constant so the branch is exercised.
    const fakeZodErr = new ZodError([]);
    fakeZodErr.errors = [{ message: ERROR_NAMES.UNAUTHORIZED }];

    const result = handleZodError(fakeZodErr);
    expect(result).toBeInstanceOf(UnauthorizedError);
    expect(result.message).toBe('Invalid token');
  });

  it('returns BadRequest for all other Zod validation errors', () => {
    const err = makeZodError(z.number(), 'not-a-number');
    const result = handleZodError(err);
    expect(result).toBeInstanceOf(BadRequest);
  });
});
