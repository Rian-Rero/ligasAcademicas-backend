import { z } from 'zod';

import objectIdSchema from '../utils/libs/zod/objectIdSchema.js';
import validate from './validate.js';

const dateSchema = (fieldName) =>
  z.preprocess(
    (value) => {
      if (value instanceof Date) return value;

      if (typeof value === 'string' || typeof value === 'number') {
        const parsedDate = new Date(value);
        if (!Number.isNaN(parsedDate.getTime())) return parsedDate;
      }

      return value;
    },
    z.date({
      invalid_type_error: `${fieldName} must be a valid date`,
      required_error: `${fieldName} must be a valid date`,
    }),
  );

const squadSchema = z.union([objectIdSchema('Event squad'), z.null()]);

export const get = validate(
  z.object({
    query: z.object({
      _id: objectIdSchema('Event _id').optional(),
      academicLeague: objectIdSchema('Event academic league').optional(),
      squad: objectIdSchema('Event squad').optional(),
      title: z.string().trim().optional(),
      description: z.string().trim().optional(),
      location: z.string().trim().optional(),
      startsAfter: dateSchema('Event startsAfter').optional(),
      startsBefore: dateSchema('Event startsBefore').optional(),
    }),
  }),
);

export const getById = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Event _id'),
    }),
  }),
);

export const create = validate(
  z.object({
    body: z.object({
      academicLeague: objectIdSchema('Event academic league'),
      squad: squadSchema.optional(),
      title: z
        .string({ required_error: 'Event title is required' })
        .trim()
        .min(3, 'Event title must be at least 3 characters')
        .max(120, 'Event title must be a maximum of 120 characters'),
      description: z
        .string({ required_error: 'Event description is required' })
        .trim()
        .min(3, 'Event description must be at least 3 characters')
        .max(500, 'Event description must be a maximum of 500 characters'),
      dateTime: dateSchema('Event dateTime'),
      location: z
        .string({ required_error: 'Event location is required' })
        .trim()
        .min(2, 'Event location must be at least 2 characters')
        .max(180, 'Event location must be a maximum of 180 characters'),
    }),
  }),
);

export const update = validate(
  z.object({
    body: z.object({
      academicLeague: objectIdSchema('Event academic league').optional(),
      squad: squadSchema.optional(),
      title: z
        .string()
        .trim()
        .min(3, 'Event title must be at least 3 characters')
        .max(120, 'Event title must be a maximum of 120 characters')
        .optional(),
      description: z
        .string()
        .trim()
        .min(3, 'Event description must be at least 3 characters')
        .max(500, 'Event description must be a maximum of 500 characters')
        .optional(),
      dateTime: dateSchema('Event dateTime').optional(),
      location: z
        .string()
        .trim()
        .min(2, 'Event location must be at least 2 characters')
        .max(180, 'Event location must be a maximum of 180 characters')
        .optional(),
    }),
    params: z.object({
      _id: objectIdSchema('Event _id'),
    }),
  }),
);

export const destroy = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Event _id'),
    }),
  }),
);

export const getEngagementById = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Event _id'),
    }),
  }),
);
