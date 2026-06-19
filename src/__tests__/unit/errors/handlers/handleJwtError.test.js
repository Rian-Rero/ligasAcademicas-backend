import { describe, expect, it } from 'vitest';

import { ForbiddenError } from '../../../../errors/baseErrors.js';
import {
  handleJwtError,
  isJwtError,
} from '../../../../errors/handlers/handleJwtError.js';

describe('isJwtError', () => {
  it('returns true for JsonWebTokenError', () => {
    expect(isJwtError({ name: 'JsonWebTokenError' })).toBe(true);
  });

  it('returns true for TokenExpiredError', () => {
    expect(isJwtError({ name: 'TokenExpiredError' })).toBe(true);
  });

  it('returns false for other error names', () => {
    expect(isJwtError({ name: 'ValidationError' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isJwtError(null)).toBe(false);
  });
});

describe('handleJwtError', () => {
  it('returns a ForbiddenError with "Invalid JWT token" for JsonWebTokenError', () => {
    const result = handleJwtError({ name: 'JsonWebTokenError' });
    expect(result).toBeInstanceOf(ForbiddenError);
    expect(result.message).toBe('Invalid JWT token');
  });

  it('returns a ForbiddenError with "JWT token expired" for TokenExpiredError', () => {
    const result = handleJwtError({ name: 'TokenExpiredError' });
    expect(result).toBeInstanceOf(ForbiddenError);
    expect(result.message).toBe('JWT token expired');
  });
});
