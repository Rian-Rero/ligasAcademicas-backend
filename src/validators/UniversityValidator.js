import { z } from 'zod';

import objectIdSchema from '../utils/libs/zod/objectIdSchema.js';
import validate from './validate.js';

export const get = validate(
  z.object({
    query: z.object({
      _id: objectIdSchema('University _id').optional(),
      name: z.string().trim().optional(),
      street: z.string().trim().optional(),
      number: z.coerce.number().int().positive().optional(),
      complement: z.string().trim().optional(),
    }),
  }),
);

export const getById = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('University _id'),
    }),
  }),
);

export const create = validate(
  z.object({
    body: z.object({
      name: z
        .string({ required_error: 'University name is required' })
        .trim()
        .min(3, 'University name must be at least 3 characters')
        .max(120, 'University name must be a maximum of 120 characters'),
      street: z
        .string({ required_error: 'University street is required' })
        .trim()
        .min(3, 'University street must be at least 3 characters')
        .max(120, 'University street must be a maximum of 120 characters'),
      number: z.coerce
        .number({ required_error: 'University number is required' })
        .int('University number must be an integer')
        .positive('University number must be greater than zero'),
      complement: z
        .string()
        .trim()
        .max(120, 'University complement must be a maximum of 120 characters')
        .optional(),
    }),
  }),
);

export const update = validate(
  z.object({
    body: z.object({
      name: z
        .string()
        .trim()
        .min(3, 'University name must be at least 3 characters')
        .max(120, 'University name must be a maximum of 120 characters')
        .optional(),
      street: z
        .string()
        .trim()
        .min(3, 'University street must be at least 3 characters')
        .max(120, 'University street must be a maximum of 120 characters')
        .optional(),
      number: z.coerce
        .number()
        .int('University number must be an integer')
        .positive('University number must be greater than zero')
        .optional(),
      complement: z
        .string()
        .trim()
        .max(120, 'University complement must be a maximum of 120 characters')
        .optional(),
    }),
    params: z.object({
      _id: objectIdSchema('University _id'),
    }),
  }),
);

export const destroy = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('University _id'),
    }),
  }),
);
