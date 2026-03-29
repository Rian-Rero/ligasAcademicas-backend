import { z } from 'zod';

import objectIdSchema from '../utils/libs/zod/objectIdSchema.js';
import validate from './validate.js';

export const get = validate(
  z.object({
    query: z.object({
      _id: objectIdSchema('User _id').optional(),
      name: z.string().optional(),
      role: z.string().optional(),
      isAdmin: z.boolean().optional(),
      emailVerified: z.boolean().optional(),
      email: z.string().optional(),
    }),
  }),
);

export const getById = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('User _id'),
    }),
  }),
);

export const create = validate(
  z.object({
    body: z.object({
      name: z
        .string({ required_error: 'User name is required' })
        .min(3, 'User name must be atleast 3 characters')
        .max(40, 'User name must be a maximum of 40 characters'),
      role: z.string().default('user'),
      isAdmin: z.boolean().default(false),
      isGoogleUser: z.boolean().default(false),
      emailVerified: z.boolean().default(false),
      email: z
        .string({ required_error: 'User email is required' })
        .email('User email must be valid'),
      password: z
        .string()
        .min(6, 'User password must be at least 3 characters')
        .max(16, 'User password must be a maximum of 30 characters')
        .optional(),
      imageURL: z.string().optional(),
    }),
  }),
);

export const verifyEmail = validate(
  z.object({
    params: z.object({
      token: z.string({ required_error: 'User email token is required' }),
    }),
  }),
);

export const forgotPassword = validate(
  z.object({
    body: z.object({
      email: z.string({ required_error: 'User email is required' }),
    }),
  }),
);

export const redefinePassword = validate(
  z.object({
    body: z.object({
      newPassword: z.string({ required_error: 'Uer new password is required' }),
    }),
    params: z.object({
      token: z.string({
        required_error: 'User forgot password token is required',
      }),
    }),
  }),
);

export const update = validate(
  z.object({
    body: z.object({
      name: z
        .string()
        .min(3, 'User name must be atleast 3 characters')
        .max(40, 'User name must be a maximum of 40 characters')
        .optional(),
      role: z
        .string()
        .min(3, 'User role must be atleast 3 characters')
        .max(40, 'User role must be a maximum of 40 characters')
        .optional(),
    }),
    params: z.object({
      _id: objectIdSchema('User _id'),
    }),
  }),
);

export const destroy = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('User _id'),
    }),
  }),
);
