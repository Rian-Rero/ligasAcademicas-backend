import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock multer so we can inspect the options it is called with without spinning
// up a real HTTP stack.
vi.mock('multer', () => {
  const memoryStorage = vi.fn(() => ({ _type: 'memoryStorage' }));
  const multerFn = vi.fn((options) => ({ _options: options, _isMulter: true }));
  multerFn.memoryStorage = memoryStorage;
  return { default: multerFn };
});

import multer from 'multer';
import multerConfig from '../../../../utils/libs/multer/multerConfig.js';
import { BadRequest } from '../../../../errors/baseErrors.js';

// Convenience: call the fileFilter and return the error (or null) passed to cb
function runFileFilter(multerInstance, file) {
  const cb = vi.fn();
  multerInstance._options.fileFilter(null, file, cb);
  return cb;
}

describe('multerConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Basic construction
  // -------------------------------------------------------------------------

  describe('construction', () => {
    it('returns a multer instance (object returned by multer())', () => {
      const instance = multerConfig({ allowedMimes: ['image/jpeg'] });
      expect(instance._isMulter).toBe(true);
    });

    it('calls multer() exactly once per invocation', () => {
      multerConfig({ allowedMimes: ['image/jpeg'] });
      expect(multer).toHaveBeenCalledOnce();
    });

    it('uses memoryStorage as default storage when none is provided', () => {
      multerConfig({ allowedMimes: ['image/jpeg'] });
      const options = multer.mock.calls[0][0];
      // memoryStorage() was called to produce the default
      expect(multer.memoryStorage).toHaveBeenCalled();
      expect(options.storage).toEqual({ _type: 'memoryStorage' });
    });

    it('uses the provided storage option', () => {
      const customStorage = { _type: 'diskStorage' };
      multerConfig({ allowedMimes: ['image/jpeg'], storage: customStorage });
      const options = multer.mock.calls[0][0];
      expect(options.storage).toBe(customStorage);
    });
  });

  // -------------------------------------------------------------------------
  // File size limits
  // -------------------------------------------------------------------------

  describe('file size limits', () => {
    it('sets fileSize limit in bytes when sizeLimitInMB is provided', () => {
      multerConfig({ allowedMimes: [], sizeLimitInMB: 5 });
      const options = multer.mock.calls[0][0];
      expect(options.limits).toEqual({ fileSize: 5 * 1024 * 1024 });
    });

    it('sets limits to undefined when sizeLimitInMB is not provided', () => {
      multerConfig({ allowedMimes: [] });
      const options = multer.mock.calls[0][0];
      expect(options.limits).toBeUndefined();
    });

    it('correctly converts 1 MB to 1048576 bytes', () => {
      multerConfig({ allowedMimes: [], sizeLimitInMB: 1 });
      const options = multer.mock.calls[0][0];
      expect(options.limits.fileSize).toBe(1_048_576);
    });

    it('correctly converts 100 MB', () => {
      multerConfig({ allowedMimes: [], sizeLimitInMB: 100 });
      const options = multer.mock.calls[0][0];
      expect(options.limits.fileSize).toBe(100 * 1024 * 1024);
    });
  });

  // -------------------------------------------------------------------------
  // fileFilter – allowed mime types
  // -------------------------------------------------------------------------

  describe('fileFilter – allowed mime types', () => {
    it('calls cb(null, true) for an allowed mime type', () => {
      const instance = multerConfig({
        allowedMimes: ['image/jpeg', 'image/png'],
      });
      const cb = runFileFilter(instance, {
        mimetype: 'image/jpeg',
        fieldname: 'photo',
      });
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('calls cb(null, true) for each allowed mime type', () => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      const instance = multerConfig({ allowedMimes: allowed });
      for (const mimetype of allowed) {
        const cb = runFileFilter(instance, { mimetype, fieldname: 'pic' });
        expect(cb).toHaveBeenCalledWith(null, true);
        cb.mockClear();
      }
    });
  });

  // -------------------------------------------------------------------------
  // fileFilter – rejected mime types
  // -------------------------------------------------------------------------

  describe('fileFilter – rejected mime types', () => {
    it('calls cb(error) for a disallowed mime type', () => {
      const instance = multerConfig({ allowedMimes: ['image/jpeg'] });
      const cb = runFileFilter(instance, {
        mimetype: 'image/gif',
        fieldname: 'photo',
      });
      expect(cb).toHaveBeenCalledOnce();
      const [err] = cb.mock.calls[0];
      expect(err).toBeInstanceOf(BadRequest);
    });

    it('uses the custom errorMessage when provided', () => {
      const instance = multerConfig({
        allowedMimes: ['image/jpeg'],
        errorMessage: 'Custom error: wrong type',
      });
      const cb = runFileFilter(instance, {
        mimetype: 'application/pdf',
        fieldname: 'photo',
      });
      const [err] = cb.mock.calls[0];
      expect(err.message).toBe('Custom error: wrong type');
    });

    it('uses the default error message (fieldname + mime type) when no errorMessage is provided', () => {
      const instance = multerConfig({ allowedMimes: ['image/jpeg'] });
      const cb = runFileFilter(instance, {
        mimetype: 'video/mp4',
        fieldname: 'avatar',
      });
      const [err] = cb.mock.calls[0];
      expect(err.message).toContain('avatar');
      expect(err.message).toContain('mime type');
    });

    it('error is a BadRequest with httpCode 400', () => {
      const instance = multerConfig({ allowedMimes: ['image/jpeg'] });
      const cb = runFileFilter(instance, {
        mimetype: 'text/plain',
        fieldname: 'file',
      });
      const [err] = cb.mock.calls[0];
      expect(err.httpCode).toBe(400);
    });

    it('does NOT call cb(null, true) when mime type is rejected', () => {
      const instance = multerConfig({ allowedMimes: ['image/jpeg'] });
      const cb = runFileFilter(instance, {
        mimetype: 'image/gif',
        fieldname: 'photo',
      });
      expect(cb).not.toHaveBeenCalledWith(null, true);
    });
  });

  // -------------------------------------------------------------------------
  // Empty allowedMimes (rejects everything)
  // -------------------------------------------------------------------------

  describe('with empty allowedMimes', () => {
    it('rejects any mime type when allowedMimes is empty', () => {
      const instance = multerConfig({ allowedMimes: [] });
      const cb = runFileFilter(instance, {
        mimetype: 'image/jpeg',
        fieldname: 'photo',
      });
      const [err] = cb.mock.calls[0];
      expect(err).toBeInstanceOf(BadRequest);
    });
  });

  // -------------------------------------------------------------------------
  // Default options (called with no arguments)
  // -------------------------------------------------------------------------

  describe('default options', () => {
    it('does not throw when called with no arguments', () => {
      expect(() => multerConfig()).not.toThrow();
    });

    it('returns a multer instance with empty allowedMimes by default', () => {
      const instance = multerConfig();
      expect(instance._isMulter).toBe(true);
    });
  });
});
