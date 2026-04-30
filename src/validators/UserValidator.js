import { z } from 'zod';

import objectIdSchema from '../utils/libs/zod/objectIdSchema.js';
import validate from './validate.js';

export const get = validate(
  z.object({
    query: z.object({
      _id: objectIdSchema('User _id').optional(),
      name: z.string().optional(),
      globalRole: z.string().optional(),
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
        .min(3, 'User name must be at least 3 characters')
        .max(40, 'User name must be a maximum of 40 characters'),
      globalRole: z.string().default('league-member'),
      emailVerified: z.boolean().default(false),
      email: z.email('User email must be valid'),
      password: z
        .string()
        .min(6, 'User password must be at least 6 characters')
        .max(16, 'User password must be a maximum of 16 characters')
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

export const getGoogleCalendarLinkUrl = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('User _id'),
    }),
  }),
);

export const handleGoogleCalendarCallback = validate(
  z.object({
    query: z.object({
      code: z.string({ required_error: 'Google callback code is required' }),
      state: z.string({ required_error: 'Google callback state is required' }),
    }),
  }),
);

export const unlinkGoogleCalendar = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('User _id'),
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
      newPassword: z.string({
        required_error: 'User new password is required',
      }),
    }),
    params: z.object({
      token: z.string({
        required_error: 'User forgot password token is required',
      }),
    }),
  }),
);

export const changePassword = validate(
  z.object({
    body: z.object({
      newPassword: z
        .string({ required_error: 'User new password is required' })
        .min(6, 'User password must be at least 6 characters')
        .max(16, 'User password must be a maximum of 16 characters'),
      currentPassword: z.string().optional(),
    }),
    params: z.object({
      _id: objectIdSchema('User _id'),
    }),
  }),
);

export const update = validate(
  z.object({
    body: z.object({
      name: z
        .string()
        .min(3, 'User name must be at least 3 characters')
        .max(40, 'User name must be a maximum of 40 characters')
        .optional(),
      imageURL: z.string().optional(),
    }),
    params: z.object({
      _id: objectIdSchema('User _id'),
    }),
  }),
);

export const uploadProfilePhoto = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('User _id'),
    }),
  }),
);

export const updateByManagement = validate(
  z.object({
    body: z.object({
      name: z
        .string()
        .min(3, 'User name must be at least 3 characters')
        .max(40, 'User name must be a maximum of 40 characters')
        .optional(),
      email: z.email('User email must be valid').optional(),
      globalRole: z
        .string()
        .min(3, 'User global role must be at least 3 characters')
        .max(40, 'User global role must be a maximum of 40 characters')
        .optional(),
      emailVerified: z.boolean().optional(),
      imageURL: z.string().optional(),
    }),
    params: z.object({
      _id: objectIdSchema('User _id'),
    }),
  }),
);

export const resetPasswordByManagement = validate(
  z.object({
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
