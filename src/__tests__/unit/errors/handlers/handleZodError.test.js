import { z } from 'zod';
import { describe, expect, it } from 'vitest';

import { BadRequest } from '../../../../errors/baseErrors.js';
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
});

describe('handleZodError', () => {
  it('returns a BadRequest for normal validation failures', () => {
    const err = makeZodError(z.string(), 123);
    const result = handleZodError(err);
    expect(result).toBeInstanceOf(BadRequest);
    expect(result.message).toContain('Request validation error(s)');
  });

  it('returns BadRequest for all Zod validation errors (Zod v4 uses issues, not errors)', () => {
    const err = makeZodError(z.number(), 'not-a-number');
    const result = handleZodError(err);
    expect(result).toBeInstanceOf(BadRequest);
  });
});
