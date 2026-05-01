import { z } from 'zod';
import objectIdSchema from '../utils/libs/zod/objectIdSchema.js';
import validate from './validate.js';

const roleKeySchema = z
  .string()
  .trim()
  .min(3)
  .max(100)
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Chave deve conter apenas letras, números e underscores',
  );

export const get = validate(
  z.object({
    query: z
      .object({
        isGlobal: z.preprocess((value) => {
          if (typeof value === 'string') {
            return value === 'true';
          }
          return value;
        }, z.boolean().optional()),
        academicLeague: objectIdSchema('Role academic league').optional(),
        isSystem: z.preprocess((value) => {
          if (typeof value === 'string') {
            return value === 'true';
          }
          return value;
        }, z.boolean().optional()),
        module: z.string().optional(),
      })
      .optional(),
  }),
);

export const getById = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Role _id'),
    }),
  }),
);

export const create = validate(
  z.object({
    body: z.object({
      name: z.string().trim().min(1).max(255),
      key: roleKeySchema,
      description: z.string().trim().max(500).optional(),
      permissions: z.array(objectIdSchema('Permission')).optional().default([]),
      isSystem: z.boolean().optional().default(false),
      isGlobal: z.boolean().optional().default(false),
      academicLeague: objectIdSchema('Academic league').nullable().optional(),
      color: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i)
        .optional()
        .default('#6366F1'),
      priority: z.number().int().min(0).optional().default(0),
    }),
  }),
);

export const update = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Role _id'),
    }),
    body: z
      .object({
        name: z.string().trim().min(1).max(255).optional(),
        description: z.string().trim().max(500).optional(),
        permissions: z.array(objectIdSchema('Permission')).optional(),
        isGlobal: z.boolean().optional(),
        academicLeague: objectIdSchema('Academic league').nullable().optional(),
        color: z
          .string()
          .regex(/^#[0-9A-F]{6}$/i)
          .optional(),
        priority: z.number().int().min(0).optional(),
      })
      .partial(),
  }),
);

export const destroy = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Role _id'),
    }),
  }),
);

export const addPermissionToRole = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Role _id'),
    }),
    body: z.object({
      permissionId: objectIdSchema('Permission _id'),
    }),
  }),
);

export const removePermissionFromRole = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Role _id'),
    }),
    body: z.object({
      permissionId: objectIdSchema('Permission _id'),
    }),
  }),
);
