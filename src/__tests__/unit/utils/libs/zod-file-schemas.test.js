import { describe, expect, it, vi } from 'vitest';

// DOCUMENTS_CONFIG and VIDEOS_CONFIG are not yet defined in constants.js,
// so we supply representative stand-ins here to make the schemas constructable.
vi.mock('../../../../utils/general/constants.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    DOCUMENTS_CONFIG: {
      fileName: 'Document',
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      sizeLimitInMB: 10,
    },
    VIDEOS_CONFIG: {
      fileName: 'Video',
      allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
      sizeLimitInMB: 100,
    },
  };
});

import {
  documentSchema,
  pictureSchema,
  videoSchema,
} from '../../../../utils/libs/zod/fileSchemas.js';

const MB = (n) => n * 1024 * 1024;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function validPictureInput(overrides = {}) {
  return {
    originalname: 'photo.jpg',
    key: 'abc123',
    location: 'https://bucket.s3.amazonaws.com/photo.jpg',
    bucket: 'my-bucket',
    size: MB(1),
    mimetype: 'image/jpeg',
    ...overrides,
  };
}

function validDocumentInput(overrides = {}) {
  return {
    originalname: 'report.pdf',
    key: 'doc456',
    location: 'https://bucket.s3.amazonaws.com/report.pdf',
    bucket: 'my-bucket',
    size: MB(2),
    mimetype: 'application/pdf',
    ...overrides,
  };
}

function validVideoInput(overrides = {}) {
  return {
    originalname: 'clip.mp4',
    key: 'vid789',
    location: 'https://bucket.s3.amazonaws.com/clip.mp4',
    bucket: 'my-bucket',
    size: MB(50),
    mimetype: 'video/mp4',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// pictureSchema
// ---------------------------------------------------------------------------

describe('pictureSchema', () => {
  describe('valid inputs', () => {
    it('parses a valid picture object successfully', () => {
      const result = pictureSchema.safeParse(validPictureInput());
      expect(result.success).toBe(true);
    });

    it('transforms originalname → name', () => {
      const result = pictureSchema.safeParse(validPictureInput());
      expect(result.data).toHaveProperty('name', 'photo.jpg');
      expect(result.data).not.toHaveProperty('originalname');
    });

    it('transforms location → url', () => {
      const result = pictureSchema.safeParse(validPictureInput());
      expect(result.data).toHaveProperty(
        'url',
        'https://bucket.s3.amazonaws.com/photo.jpg',
      );
      expect(result.data).not.toHaveProperty('location');
    });

    it('transforms mimetype → mimeType', () => {
      const result = pictureSchema.safeParse(validPictureInput());
      expect(result.data).toHaveProperty('mimeType', 'image/jpeg');
      expect(result.data).not.toHaveProperty('mimetype');
    });

    it('removes size and bucket from output', () => {
      const result = pictureSchema.safeParse(validPictureInput());
      expect(result.data).not.toHaveProperty('size');
      expect(result.data).not.toHaveProperty('bucket');
    });

    it('keeps the key in output', () => {
      const result = pictureSchema.safeParse(validPictureInput());
      expect(result.data).toHaveProperty('key', 'abc123');
    });

    it('accepts all allowed picture mime types', () => {
      const allowedTypes = [
        'image/jpeg',
        'image/pjpeg',
        'image/png',
        'image/webp',
        'image/jpg',
      ];
      for (const mimetype of allowedTypes) {
        const result = pictureSchema.safeParse(validPictureInput({ mimetype }));
        expect(result.success, `expected success for ${mimetype}`).toBe(true);
      }
    });

    it('accepts file at exactly the size limit', () => {
      const result = pictureSchema.safeParse(
        validPictureInput({ size: MB(5) }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('fails when mimetype is not in the allowed list', () => {
      const result = pictureSchema.safeParse(
        validPictureInput({ mimetype: 'image/gif' }),
      );
      expect(result.success).toBe(false);
      // At least one issue is reported for the invalid mimetype
      expect(result.error.issues.length).toBeGreaterThan(0);
    });

    it('fails when size exceeds the limit (5 MB)', () => {
      const result = pictureSchema.safeParse(
        validPictureInput({ size: MB(5) + 1 }),
      );
      expect(result.success).toBe(false);
    });

    it('fails when originalname is missing', () => {
      const input = validPictureInput();
      delete input.originalname;
      const result = pictureSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('fails when key is missing', () => {
      const input = validPictureInput();
      delete input.key;
      const result = pictureSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('fails when location is missing', () => {
      const input = validPictureInput();
      delete input.location;
      const result = pictureSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('fails when size is missing', () => {
      const input = validPictureInput();
      delete input.size;
      const result = pictureSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('fails when mimetype is missing', () => {
      const input = validPictureInput();
      delete input.mimetype;
      const result = pictureSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// documentSchema
// ---------------------------------------------------------------------------

describe('documentSchema', () => {
  describe('valid inputs', () => {
    it('parses a valid PDF document', () => {
      const result = documentSchema.safeParse(validDocumentInput());
      expect(result.success).toBe(true);
    });

    it('transforms field names correctly (originalname→name, location→url, mimetype→mimeType)', () => {
      const result = documentSchema.safeParse(validDocumentInput());
      expect(result.data).toHaveProperty('name', 'report.pdf');
      expect(result.data).toHaveProperty('url');
      expect(result.data).toHaveProperty('mimeType', 'application/pdf');
    });

    it('removes size and bucket from output', () => {
      const result = documentSchema.safeParse(validDocumentInput());
      expect(result.data).not.toHaveProperty('size');
      expect(result.data).not.toHaveProperty('bucket');
    });

    it('accepts all allowed document mime types', () => {
      const allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      for (const mimetype of allowed) {
        const result = documentSchema.safeParse(
          validDocumentInput({ mimetype }),
        );
        expect(result.success, `expected success for ${mimetype}`).toBe(true);
      }
    });

    it('accepts a document at exactly the size limit (10 MB)', () => {
      const result = documentSchema.safeParse(
        validDocumentInput({ size: MB(10) }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('fails for a disallowed mime type (e.g. application/zip)', () => {
      const result = documentSchema.safeParse(
        validDocumentInput({ mimetype: 'application/zip' }),
      );
      expect(result.success).toBe(false);
    });

    it('fails when size exceeds 10 MB', () => {
      const result = documentSchema.safeParse(
        validDocumentInput({ size: MB(10) + 1 }),
      );
      expect(result.success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// videoSchema
// ---------------------------------------------------------------------------

describe('videoSchema', () => {
  describe('valid inputs', () => {
    it('parses a valid video input', () => {
      const result = videoSchema.safeParse(validVideoInput());
      expect(result.success).toBe(true);
    });

    it('transforms location → url and mimetype → mimeType', () => {
      const result = videoSchema.safeParse(validVideoInput());
      expect(result.data).toHaveProperty('url');
      expect(result.data).toHaveProperty('mimeType', 'video/mp4');
    });

    it('removes name, size, and bucket from output', () => {
      const result = videoSchema.safeParse(validVideoInput());
      expect(result.data).not.toHaveProperty('name');
      expect(result.data).not.toHaveProperty('size');
      expect(result.data).not.toHaveProperty('bucket');
    });

    it('keeps key in output', () => {
      const result = videoSchema.safeParse(validVideoInput());
      expect(result.data).toHaveProperty('key', 'vid789');
    });

    it('accepts all allowed video mime types', () => {
      const allowed = ['video/mp4', 'video/quicktime', 'video/webm'];
      for (const mimetype of allowed) {
        const result = videoSchema.safeParse(validVideoInput({ mimetype }));
        expect(result.success, `expected success for ${mimetype}`).toBe(true);
      }
    });

    it('accepts a video at exactly the size limit (100 MB)', () => {
      const result = videoSchema.safeParse(validVideoInput({ size: MB(100) }));
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('fails for a disallowed mime type (e.g. video/avi)', () => {
      const result = videoSchema.safeParse(
        validVideoInput({ mimetype: 'video/avi' }),
      );
      expect(result.success).toBe(false);
    });

    it('fails when size exceeds 100 MB', () => {
      const result = videoSchema.safeParse(
        validVideoInput({ size: MB(100) + 1 }),
      );
      expect(result.success).toBe(false);
    });
  });
});
