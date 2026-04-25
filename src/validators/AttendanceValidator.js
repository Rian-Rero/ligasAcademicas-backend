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
      _id: objectIdSchema('Attendance _id').optional(),
      event: objectIdSchema('Attendance event').optional(),
      leagueMembership: objectIdSchema(
        'Attendance league membership',
      ).optional(),
      isConfirmed: queryBooleanSchema.optional(),
      hasAttended: queryBooleanSchema.optional(),
    }),
  }),
);

export const getById = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Attendance _id'),
    }),
  }),
);

export const create = validate(
  z.object({
    body: z.object({
      event: objectIdSchema('Attendance event'),
      leagueMembership: objectIdSchema('Attendance league membership'),
      isConfirmed: z.boolean().default(false),
      hasAttended: z.boolean().default(false),
    }),
  }),
);

export const update = validate(
  z.object({
    body: z.object({
      event: objectIdSchema('Attendance event').optional(),
      leagueMembership: objectIdSchema(
        'Attendance league membership',
      ).optional(),
      isConfirmed: z.boolean().optional(),
      hasAttended: z.boolean().optional(),
    }),
    params: z.object({
      _id: objectIdSchema('Attendance _id'),
    }),
  }),
);

export const destroy = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Attendance _id'),
    }),
  }),
);

export const confirm = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Attendance _id'),
    }),
  }),
);

export const markAttendance = validate(
  z.object({
    body: z
      .object({
        hasAttended: z.boolean().optional(),
      })
      .default({}),
    params: z.object({
      _id: objectIdSchema('Attendance _id'),
    }),
  }),
);
