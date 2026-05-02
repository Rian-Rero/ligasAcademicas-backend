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

const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM');

export const get = validate(
  z.object({
    query: z.object({
      _id: objectIdSchema('Task _id').optional(),
      assignedTo: objectIdSchema('Task assigned to').optional(),
      assignedBy: objectIdSchema('Task assigned by').optional(),
      priority: prioritySchema.optional(),
      completed: z
        .enum(['true', 'false'])
        .transform((value) => value === 'true')
        .optional(),
      title: z.string().trim().optional(),
      dueDateBefore: dateSchema('Task dueDateBefore').optional(),
      dueDateAfter: dateSchema('Task dueDateAfter').optional(),
    }),
  }),
);

export const getById = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Task _id'),
    }),
  }),
);

export const create = validate(
  z.object({
    body: z.object({
      title: z
        .string({ required_error: 'Task title is required' })
        .trim()
        .min(3, 'Task title must be at least 3 characters')
        .max(120, 'Task title must be a maximum of 120 characters'),
      description: z
        .string({ required_error: 'Task description is required' })
        .trim()
        .min(3, 'Task description must be at least 3 characters')
        .max(1000, 'Task description must be a maximum of 1000 characters'),
      dueDate: dateSchema('Task dueDate'),
      priority: prioritySchema.optional(),
      assignedTo: objectIdSchema('Task assigned to'),
    }),
  }),
);

export const update = validate(
  z.object({
    body: z.object({
      title: z
        .string()
        .trim()
        .min(3, 'Task title must be at least 3 characters')
        .max(120, 'Task title must be a maximum of 120 characters')
        .optional(),
      description: z
        .string()
        .trim()
        .min(3, 'Task description must be at least 3 characters')
        .max(1000, 'Task description must be a maximum of 1000 characters')
        .optional(),
      dueDate: dateSchema('Task dueDate').optional(),
      priority: prioritySchema.optional(),
      completed: z.boolean().optional(),
    }),
    params: z.object({
      _id: objectIdSchema('Task _id'),
    }),
  }),
);

export const destroy = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Task _id'),
    }),
  }),
);

export const completeTask = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Task _id'),
    }),
  }),
);
