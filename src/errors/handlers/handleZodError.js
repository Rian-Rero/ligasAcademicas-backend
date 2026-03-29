import { ZodError } from 'zod';

import { ERROR_NAMES } from '../../utils/general/constants.js';
import { BadRequest, UnauthorizedError } from '../baseErrors.js';

export function isZodError(err) {
  return err instanceof ZodError;
}
export function handleZodError(err) {
  const msg = err.errors.map(({ message }) => message).join('; ');

  if (msg === ERROR_NAMES.UNAUTHORIZED)
    return new UnauthorizedError('Invalid token'); // Only case is in the refresh token route

  return new BadRequest(`Request validation error(s): ${msg}`);
}
