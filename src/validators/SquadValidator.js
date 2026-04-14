import { z } from 'zod';

import objectIdSchema from '../utils/libs/zod/objectIdSchema.js';
import validate from './validate.js';

export const get = validate(
  z.object({
    query: z.object({
      _id: objectIdSchema('Squad _id').optional(),
      academicLeague: objectIdSchema('Squad academic league').optional(),
      name: z.string().trim().optional(),
      description: z.string().trim().optional(),
      function: z.string().trim().optional(),
    }),
  }),
);

export const getById = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Squad _id'),
    }),
  }),
);

export const create = validate(
  z.object({
    body: z.object({
      academicLeague: objectIdSchema('Squad academic league'),
      name: z
        .string({ required_error: 'Squad name is required' })
        .trim()
        .min(3, 'Squad name must be at least 3 characters')
        .max(120, 'Squad name must be a maximum of 120 characters'),
      description: z
        .string({ required_error: 'Squad description is required' })
        .trim()
        .min(3, 'Squad description must be at least 3 characters')
        .max(500, 'Squad description must be a maximum of 500 characters'),
      function: z
        .string()
        .trim()
        .max(120, 'Squad function must be a maximum of 120 characters')
        .optional(),
    }),
  }),
);

export const update = validate(
  z.object({
    body: z.object({
      academicLeague: objectIdSchema('Squad academic league').optional(),
      name: z
        .string()
        .trim()
        .min(3, 'Squad name must be at least 3 characters')
        .max(120, 'Squad name must be a maximum of 120 characters')
        .optional(),
      description: z
        .string()
        .trim()
        .min(3, 'Squad description must be at least 3 characters')
        .max(500, 'Squad description must be a maximum of 500 characters')
        .optional(),
      function: z
        .string()
        .trim()
        .max(120, 'Squad function must be a maximum of 120 characters')
        .optional(),
    }),
    params: z.object({
      _id: objectIdSchema('Squad _id'),
    }),
  }),
);

export const destroy = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Squad _id'),
    }),
  }),
);
