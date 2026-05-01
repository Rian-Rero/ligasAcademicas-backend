import { z } from 'zod';
import objectIdSchema from '../utils/libs/zod/objectIdSchema.js';
import validate from './validate.js';

const permissionKeySchema = z
  .string()
  .trim()
  .min(3)
  .max(100)
  .regex(
    /^[a-zA-Z0-9_.]+$/,
    'Chave deve conter apenas letras, números, underscores e pontos',
  );

export const get = validate(
  z.object({
    query: z
      .object({
        module: z.string().optional(),
        isSystem: z.preprocess((value) => {
          if (typeof value === 'string') {
            return value === 'true';
          }
          return value;
        }, z.boolean().optional()),
      })
      .optional(),
  }),
);

export const getById = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Permission _id'),
    }),
  }),
);

export const create = validate(
  z.object({
    body: z.object({
      key: permissionKeySchema,
      name: z.string().trim().min(1).max(255),
      description: z.string().trim().max(500).optional(),
      module: z.enum([
        'user',
        'role',
        'permission',
        'event',
        'attendance',
        'certificate',
        'squad',
        'academicLeague',
        'leagueMembership',
        'university',
        'session',
        'system',
      ]),
      isSystem: z.boolean().optional().default(false),
    }),
  }),
);

export const update = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Permission _id'),
    }),
    body: z
      .object({
        key: permissionKeySchema.optional(),
        name: z.string().trim().min(1).max(255).optional(),
        description: z.string().trim().max(500).optional(),
        module: z
          .enum([
            'user',
            'role',
            'permission',
            'event',
            'attendance',
            'certificate',
            'squad',
            'academicLeague',
            'leagueMembership',
            'university',
            'session',
            'system',
          ])
          .optional(),
        isSystem: z.boolean().optional(),
      })
      .partial(),
  }),
);

export const destroy = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Permission _id'),
    }),
  }),
);
