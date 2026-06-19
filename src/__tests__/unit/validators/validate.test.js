import { z } from 'zod';
import { describe, expect, it } from 'vitest';

import validate from '../../../validators/validate.js';

const schema = z.object({
  body: z.object({
    name: z.string(),
  }),
  params: z
    .object({
      id: z.string().optional(),
    })
    .optional(),
});

const validator = validate(schema);

describe('validate helper', () => {
  it('returns merged flattened data when the request matches the schema', () => {
    const req = {
      body: { name: 'Alice' },
      params: {},
      query: {},
      signedCookies: {},
    };
    const result = validator(req);
    expect(result).toMatchObject({ name: 'Alice' });
  });

  it('throws a ZodError when required fields are missing', () => {
    const req = { body: {}, params: {}, query: {}, signedCookies: {} };
    expect(() => validator(req)).toThrow();
  });

  it('merges body and params into the result', () => {
    const schemaWithParams = validate(
      z.object({
        body: z.object({ name: z.string() }),
        params: z.object({ id: z.string() }),
      }),
    );
    const req = {
      body: { name: 'Bob' },
      params: { id: '123' },
      query: {},
      signedCookies: {},
    };
    const result = schemaWithParams(req);
    expect(result).toMatchObject({ name: 'Bob', id: '123' });
  });
});
