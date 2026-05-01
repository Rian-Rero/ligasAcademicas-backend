import { z } from 'zod';
import objectIdSchema from '../utils/libs/zod/objectIdSchema.js';
import validate from './validate.js';

export const getUserPermissions = validate(
  z.object({
    params: z.object({
      userId: objectIdSchema('User _id'),
    }),
  }),
);

export const getUserPermissionDetails = getUserPermissions;

export const updateUserPermissions = validate(
  z.object({
    params: z.object({
      userId: objectIdSchema('User _id'),
    }),
    body: z.object({
      roles: z.array(objectIdSchema('Role')).optional().default([]),
      permissions: z.array(objectIdSchema('Permission')).optional().default([]),
      academicLeague: objectIdSchema('Academic league').nullable().optional(),
    }),
  }),
);

export const addRoleToUser = validate(
  z.object({
    params: z.object({
      userId: objectIdSchema('User _id'),
    }),
    body: z.object({
      roleId: objectIdSchema('Role _id'),
      academicLeague: objectIdSchema('Academic league').nullable().optional(),
    }),
  }),
);

export const removeRoleFromUser = validate(
  z.object({
    params: z.object({
      userId: objectIdSchema('User _id'),
    }),
    body: z.object({
      roleId: objectIdSchema('Role _id'),
      academicLeague: objectIdSchema('Academic league').nullable().optional(),
    }),
  }),
);

export const addPermissionToUser = validate(
  z.object({
    params: z.object({
      userId: objectIdSchema('User _id'),
    }),
    body: z.object({
      permissionId: objectIdSchema('Permission _id'),
      academicLeague: objectIdSchema('Academic league').nullable().optional(),
    }),
  }),
);

export const removePermissionFromUser = validate(
  z.object({
    params: z.object({
      userId: objectIdSchema('User _id'),
    }),
    body: z.object({
      permissionId: objectIdSchema('Permission _id'),
      academicLeague: objectIdSchema('Academic league').nullable().optional(),
    }),
  }),
);
