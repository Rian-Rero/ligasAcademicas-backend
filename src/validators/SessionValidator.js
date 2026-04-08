import { z } from 'zod';

import validate from './validate.js';

export const login = validate(
  z.object({
    body: z.object({
      email: z.email('Must be a valid email'),
      password: z.string({ required_error: 'Password is required' }),
    }),
    signedCookies: z.object({
      token: z.string().or(z.boolean()).optional(),
    }),
  }),
);

export const logout = validate(
  z.object({
    signedCookies: z.object({
      token: z.string().or(z.boolean()).optional(),
    }),
  }),
);

export const refresh = validate(
  z.object({
    signedCookies: z.object({
      token: z.string().or(z.boolean()).optional(),
    }),
  }),
);
