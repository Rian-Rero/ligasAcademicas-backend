import { z } from 'zod';

import objectIdSchema from '../utils/libs/zod/objectIdSchema.js';
import validate from './validate.js';

export const get = validate(
  z.object({
    query: z.object({
      _id: objectIdSchema('Academic league _id').optional(),
      university: objectIdSchema('Academic league university').optional(),
      name: z.string().trim().optional(),
      description: z.string().trim().optional(),
      area: z.string().trim().optional(),
    }),
  }),
);

export const getById = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Academic league _id'),
    }),
  }),
);

export const create = validate(
  z.object({
    body: z.object({
      university: objectIdSchema('Academic league university'),
      name: z
        .string({ required_error: 'Academic league name is required' })
        .trim()
        .min(3, 'Academic league name must be at least 3 characters')
        .max(120, 'Academic league name must be a maximum of 120 characters'),
      description: z
        .string({ required_error: 'Academic league description is required' })
        .trim()
        .min(3, 'Academic league description must be at least 3 characters')
        .max(
          500,
          'Academic league description must be a maximum of 500 characters',
        ),
      area: z
        .string()
        .trim()
        .max(120, 'Academic league area must be a maximum of 120 characters')
        .optional(),
    }),
  }),
);

export const update = validate(
  z.object({
    body: z.object({
      university: objectIdSchema('Academic league university').optional(),
      name: z
        .string()
        .trim()
        .min(3, 'Academic league name must be at least 3 characters')
        .max(120, 'Academic league name must be a maximum of 120 characters')
        .optional(),
      description: z
        .string()
        .trim()
        .min(3, 'Academic league description must be at least 3 characters')
        .max(
          500,
          'Academic league description must be a maximum of 500 characters',
        )
        .optional(),
      area: z
        .string()
        .trim()
        .max(120, 'Academic league area must be a maximum of 120 characters')
        .optional(),
    }),
    params: z.object({
      _id: objectIdSchema('Academic league _id'),
    }),
  }),
);

export const destroy = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Academic league _id'),
    }),
  }),
);
