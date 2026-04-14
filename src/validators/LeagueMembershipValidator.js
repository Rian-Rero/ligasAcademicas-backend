import { z } from 'zod';

import objectIdSchema from '../utils/libs/zod/objectIdSchema.js';
import validate from './validate.js';

const queryBooleanSchema = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === 'true' || normalizedValue === '1') return true;
    if (normalizedValue === 'false' || normalizedValue === '0') return false;
  }

  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  return value;
}, z.boolean());

export const get = validate(
  z.object({
    query: z.object({
      _id: objectIdSchema('League membership _id').optional(),
      user: objectIdSchema('League membership user').optional(),
      academicLeague: objectIdSchema(
        'League membership academic league',
      ).optional(),
      squad: objectIdSchema('League membership squad').optional(),
      role: z.string().trim().optional(),
      isActive: queryBooleanSchema.optional(),
    }),
  }),
);

export const getById = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('League membership _id'),
    }),
  }),
);

export const create = validate(
  z.object({
    body: z.object({
      user: objectIdSchema('League membership user'),
      academicLeague: objectIdSchema('League membership academic league'),
      squad: objectIdSchema('League membership squad'),
      role: z
        .string({ required_error: 'League membership role is required' })
        .trim()
        .min(2, 'League membership role must be at least 2 characters')
        .max(80, 'League membership role must be a maximum of 80 characters'),
      isActive: z.boolean({
        required_error: 'League membership active status is required',
      }),
    }),
  }),
);

export const update = validate(
  z.object({
    body: z.object({
      user: objectIdSchema('League membership user').optional(),
      academicLeague: objectIdSchema(
        'League membership academic league',
      ).optional(),
      squad: objectIdSchema('League membership squad').optional(),
      role: z
        .string()
        .trim()
        .min(2, 'League membership role must be at least 2 characters')
        .max(80, 'League membership role must be a maximum of 80 characters')
        .optional(),
      isActive: z.boolean().optional(),
    }),
    params: z.object({
      _id: objectIdSchema('League membership _id'),
    }),
  }),
);

export const destroy = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('League membership _id'),
    }),
  }),
);
