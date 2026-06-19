import multer from 'multer';
import { describe, expect, it } from 'vitest';

import { BadRequest } from '../../../../errors/baseErrors.js';
import {
  handleMulterError,
  isMulterError,
} from '../../../../errors/handlers/handleMulterError.js';

describe('isMulterError', () => {
  it('returns true for an instance of multer.MulterError', () => {
    const err = new multer.MulterError('LIMIT_FILE_SIZE');
    expect(isMulterError(err)).toBe(true);
  });

  it('returns false for a regular Error', () => {
    expect(isMulterError(new Error('regular'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isMulterError(null)).toBe(false);
  });
});

describe('handleMulterError', () => {
  it('returns a BadRequest wrapping the multer error message', () => {
    const err = new multer.MulterError('LIMIT_FILE_SIZE');
    const result = handleMulterError(err);
    expect(result).toBeInstanceOf(BadRequest);
    expect(result.message).toContain('Multer exit with message:');
    expect(result.message.length).toBeGreaterThan(
      'Multer exit with message: '.length,
    );
  });
});
