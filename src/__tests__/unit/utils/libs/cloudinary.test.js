import { beforeEach, describe, expect, it, vi } from 'vitest';

// isDevEnvironment is false by default so production branches execute.
vi.mock('../../../../utils/general/isDevEnvironment.js', () => ({
  default: false,
}));

// Mock the cloudinary config module (wraps v2 SDK)
vi.mock('../../../../utils/libs/cloudinary/config.js', () => ({
  default: {
    uploader: {
      upload: vi.fn(),
      upload_stream: vi.fn(),
      destroy: vi.fn(),
    },
  },
}));

// Mock fs/promises so we don't touch the real file system
vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
  },
}));

import cloudinaryConfig from '../../../../utils/libs/cloudinary/config.js';
import {
  deleteFile,
  deleteFileByUrl,
  deleteFiles,
  uploadFile,
  uploadFiles,
} from '../../../../utils/libs/cloudinary/index.js';

// Helper: make upload_stream invoke the callback synchronously when .end() is called
function mockUploadStream(error, result) {
  cloudinaryConfig.uploader.upload_stream.mockImplementation(
    (_options, callback) => ({
      end: vi.fn(() => callback(error, result)),
    }),
  );
}

describe('cloudinary/index.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // uploadFile – production paths (isDevEnvironment = false)
  // ---------------------------------------------------------------------------

  describe('uploadFile (production)', () => {
    it('uploads via upload_stream when fileBuffer is provided', async () => {
      const fakeResult = {
        public_id: 'folder/my-image',
        secure_url:
          'https://res.cloudinary.com/demo/image/upload/folder/my-image.jpg',
      };
      mockUploadStream(null, fakeResult);

      const result = await uploadFile({
        fileBuffer: Buffer.from('fake-image-data'),
        publicId: 'folder/my-image',
        resourceType: 'image',
      });

      expect(cloudinaryConfig.uploader.upload_stream).toHaveBeenCalledOnce();
      expect(result).toEqual({
        key: fakeResult.public_id,
        url: fakeResult.secure_url,
      });
    });

    it('rejects when upload_stream callback returns an error', async () => {
      const uploadError = new Error('Cloudinary stream error');
      mockUploadStream(uploadError, null);

      await expect(
        uploadFile({
          fileBuffer: Buffer.from('data'),
          publicId: 'fail/image',
        }),
      ).rejects.toThrow('Cloudinary stream error');
    });

    it('uploads via uploader.upload when filePath is provided (no buffer)', async () => {
      const fakeResult = {
        public_id: 'folder/file',
        secure_url:
          'https://res.cloudinary.com/demo/raw/upload/folder/file.pdf',
      };
      cloudinaryConfig.uploader.upload.mockResolvedValue(fakeResult);

      const result = await uploadFile({
        filePath: '/tmp/file.pdf',
        publicId: 'folder/file',
        resourceType: 'raw',
      });

      expect(cloudinaryConfig.uploader.upload).toHaveBeenCalledWith(
        '/tmp/file.pdf',
        expect.objectContaining({
          public_id: 'folder/file',
          resource_type: 'raw',
        }),
      );
      expect(result).toEqual({
        key: fakeResult.public_id,
        url: fakeResult.secure_url,
      });
    });

    it('defaults resourceType to "image" when not specified', async () => {
      cloudinaryConfig.uploader.upload.mockResolvedValue({
        public_id: 'img',
        secure_url: 'https://example.com/img.jpg',
      });

      await uploadFile({ filePath: '/tmp/img.jpg' });

      expect(cloudinaryConfig.uploader.upload).toHaveBeenCalledWith(
        '/tmp/img.jpg',
        expect.objectContaining({ resource_type: 'image' }),
      );
    });

    it('includes CLOUDINARY_FOLDER in options when env var is set', async () => {
      process.env.CLOUDINARY_FOLDER = 'my-folder';
      cloudinaryConfig.uploader.upload.mockResolvedValue({
        public_id: 'my-folder/img',
        secure_url: 'https://example.com/img.jpg',
      });

      await uploadFile({ filePath: '/tmp/img.jpg' });

      expect(cloudinaryConfig.uploader.upload).toHaveBeenCalledWith(
        '/tmp/img.jpg',
        expect.objectContaining({ folder: 'my-folder' }),
      );
      delete process.env.CLOUDINARY_FOLDER;
    });

    it('passes overwrite: true in upload options', async () => {
      cloudinaryConfig.uploader.upload.mockResolvedValue({
        public_id: 'img',
        secure_url: 'https://example.com/img.jpg',
      });

      await uploadFile({ filePath: '/tmp/img.jpg' });

      expect(cloudinaryConfig.uploader.upload).toHaveBeenCalledWith(
        '/tmp/img.jpg',
        expect.objectContaining({ overwrite: true }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // uploadFile – development paths (isDevEnvironment = true)
  // ---------------------------------------------------------------------------

  describe('uploadFile (development)', () => {
    it('returns a local URL and writes buffer to disk when isDevEnvironment is true', async () => {
      vi.resetModules();
      vi.doMock('../../../../utils/general/isDevEnvironment.js', () => ({
        default: true,
      }));
      vi.doMock('fs/promises', () => ({
        default: {
          mkdir: vi.fn().mockResolvedValue(undefined),
          writeFile: vi.fn().mockResolvedValue(undefined),
          unlink: vi.fn().mockResolvedValue(undefined),
        },
      }));
      vi.doMock('../../../../utils/libs/cloudinary/config.js', () => ({
        default: {
          uploader: {
            upload: vi.fn(),
            upload_stream: vi.fn(),
            destroy: vi.fn(),
          },
        },
      }));

      const { uploadFile: devUploadFile } =
        await import('../../../../utils/libs/cloudinary/index.js');
      const fsMod = await import('fs/promises');

      const result = await devUploadFile({
        fileBuffer: Buffer.from('hello'),
        fileName: 'test.jpg',
        publicId: 'my-key',
      });

      expect(fsMod.default.mkdir).toHaveBeenCalled();
      expect(fsMod.default.writeFile).toHaveBeenCalled();
      expect(result).toEqual({
        key: 'my-key',
        url: `/temp/uploads/${encodeURIComponent('test.jpg')}`,
      });

      vi.resetModules();
    });

    it('uses publicId as key fallback when fileName is not provided in dev mode', async () => {
      vi.resetModules();
      vi.doMock('../../../../utils/general/isDevEnvironment.js', () => ({
        default: true,
      }));
      vi.doMock('fs/promises', () => ({
        default: {
          mkdir: vi.fn().mockResolvedValue(undefined),
          writeFile: vi.fn().mockResolvedValue(undefined),
          unlink: vi.fn().mockResolvedValue(undefined),
        },
      }));
      vi.doMock('../../../../utils/libs/cloudinary/config.js', () => ({
        default: {
          uploader: {
            upload: vi.fn(),
            upload_stream: vi.fn(),
            destroy: vi.fn(),
          },
        },
      }));

      const { uploadFile: devUploadFile } =
        await import('../../../../utils/libs/cloudinary/index.js');

      const result = await devUploadFile({
        filePath: '/tmp/somefile.pdf',
        publicId: 'folder/somefile',
      });

      // publicId is used as key; resolvedFileName comes from path.basename(filePath)
      expect(result.key).toBe('folder/somefile');
      vi.resetModules();
    });

    it('deletes local files from temp/uploads when isDevEnvironment is true', async () => {
      vi.resetModules();
      vi.doMock('../../../../utils/general/isDevEnvironment.js', () => ({
        default: true,
      }));
      const mockUnlink = vi.fn().mockResolvedValue(undefined);
      vi.doMock('fs/promises', () => ({
        default: {
          mkdir: vi.fn().mockResolvedValue(undefined),
          writeFile: vi.fn().mockResolvedValue(undefined),
          unlink: mockUnlink,
        },
      }));
      vi.doMock('../../../../utils/libs/cloudinary/config.js', () => ({
        default: {
          uploader: {
            upload: vi.fn(),
            upload_stream: vi.fn(),
            destroy: vi.fn(),
          },
        },
      }));

      const { deleteFile: devDeleteFile } =
        await import('../../../../utils/libs/cloudinary/index.js');

      const result = await devDeleteFile('myfile.jpg');

      // Returns null in dev mode
      expect(result).toBeNull();
      vi.resetModules();
    });
  });

  // ---------------------------------------------------------------------------
  // uploadFiles
  // ---------------------------------------------------------------------------

  describe('uploadFiles', () => {
    it('uploads multiple files and returns results array', async () => {
      cloudinaryConfig.uploader.upload
        .mockResolvedValueOnce({
          public_id: 'a',
          secure_url: 'https://example.com/a.jpg',
        })
        .mockResolvedValueOnce({
          public_id: 'b',
          secure_url: 'https://example.com/b.jpg',
        });

      const results = await uploadFiles([
        { filePath: '/tmp/a.jpg' },
        { filePath: '/tmp/b.jpg' },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        key: 'a',
        url: 'https://example.com/a.jpg',
      });
      expect(results[1]).toEqual({
        key: 'b',
        url: 'https://example.com/b.jpg',
      });
    });

    it('passes shared options to each file', async () => {
      cloudinaryConfig.uploader.upload.mockResolvedValueOnce({
        public_id: 'vid1',
        secure_url: 'https://example.com/v1.mp4',
      });

      await uploadFiles([{ filePath: '/tmp/v1.mp4' }], {
        resourceType: 'video',
      });

      expect(cloudinaryConfig.uploader.upload).toHaveBeenCalledWith(
        '/tmp/v1.mp4',
        expect.objectContaining({ resource_type: 'video' }),
      );
    });

    it('returns empty array for empty input', async () => {
      const results = await uploadFiles([]);
      expect(results).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // deleteFile – production paths
  // ---------------------------------------------------------------------------

  describe('deleteFile (production)', () => {
    it('calls cloudinary destroy with the key and resourceType', async () => {
      cloudinaryConfig.uploader.destroy.mockResolvedValue({ result: 'ok' });

      const res = await deleteFile('folder/my-image', 'image');

      expect(cloudinaryConfig.uploader.destroy).toHaveBeenCalledWith(
        'folder/my-image',
        { resource_type: 'image' },
      );
      expect(res).toEqual({ result: 'ok' });
    });

    it('defaults resourceType to "image"', async () => {
      cloudinaryConfig.uploader.destroy.mockResolvedValue({ result: 'ok' });
      await deleteFile('folder/img');
      expect(cloudinaryConfig.uploader.destroy).toHaveBeenCalledWith(
        'folder/img',
        { resource_type: 'image' },
      );
    });

    it('returns null immediately when key is null', async () => {
      const res = await deleteFile(null);
      expect(res).toBeNull();
      expect(cloudinaryConfig.uploader.destroy).not.toHaveBeenCalled();
    });

    it('returns null immediately when key is empty string', async () => {
      const res = await deleteFile('');
      expect(res).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // deleteFiles
  // ---------------------------------------------------------------------------

  describe('deleteFiles', () => {
    it('deletes multiple files and returns results', async () => {
      cloudinaryConfig.uploader.destroy
        .mockResolvedValueOnce({ result: 'ok' })
        .mockResolvedValueOnce({ result: 'ok' });

      const results = await deleteFiles(['key1', 'key2']);
      expect(results).toHaveLength(2);
      expect(cloudinaryConfig.uploader.destroy).toHaveBeenCalledTimes(2);
    });

    it('returns empty array for empty input', async () => {
      const results = await deleteFiles([]);
      expect(results).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // deleteFileByUrl
  // ---------------------------------------------------------------------------

  describe('deleteFileByUrl', () => {
    it('extracts publicId from a full cloudinary URL and deletes it', async () => {
      cloudinaryConfig.uploader.destroy.mockResolvedValue({ result: 'ok' });

      await deleteFileByUrl(
        'https://res.cloudinary.com/demo/image/upload/v1234567890/folder/my-image.jpg',
      );

      expect(cloudinaryConfig.uploader.destroy).toHaveBeenCalledWith(
        'folder/my-image',
        { resource_type: 'image' },
      );
    });

    it('handles cloudinary URL without version prefix', async () => {
      cloudinaryConfig.uploader.destroy.mockResolvedValue({ result: 'ok' });

      await deleteFileByUrl(
        'https://res.cloudinary.com/demo/image/upload/folder/photo.png',
      );

      expect(cloudinaryConfig.uploader.destroy).toHaveBeenCalledWith(
        'folder/photo',
        { resource_type: 'image' },
      );
    });

    it('returns null for a URL without /upload/ segment', async () => {
      const res = await deleteFileByUrl(
        'https://example.com/no-upload-path/file.jpg',
      );
      expect(res).toBeNull();
      expect(cloudinaryConfig.uploader.destroy).not.toHaveBeenCalled();
    });

    it('handles a local path (starts with /): uses basename as key', async () => {
      cloudinaryConfig.uploader.destroy.mockResolvedValue({ result: 'ok' });

      await deleteFileByUrl('/temp/uploads/my-file.pdf');

      expect(cloudinaryConfig.uploader.destroy).toHaveBeenCalledWith(
        'my-file.pdf',
        { resource_type: 'image' },
      );
    });

    it('returns null when fileUrl is null', async () => {
      const res = await deleteFileByUrl(null);
      expect(res).toBeNull();
    });

    it('returns null when fileUrl is empty string', async () => {
      const res = await deleteFileByUrl('');
      expect(res).toBeNull();
    });

    it('returns null for an invalid URL that is not a local path', async () => {
      const res = await deleteFileByUrl('not-a-url');
      // getPublicIdFromUrl catches the URL parse error and returns null
      expect(res).toBeNull();
    });

    it('handles URL-encoded characters in local path', async () => {
      cloudinaryConfig.uploader.destroy.mockResolvedValue({ result: 'ok' });

      await deleteFileByUrl('/temp/uploads/my%20file.pdf');

      expect(cloudinaryConfig.uploader.destroy).toHaveBeenCalledWith(
        'my file.pdf',
        { resource_type: 'image' },
      );
    });

    it('passes resourceType argument to deleteFile', async () => {
      cloudinaryConfig.uploader.destroy.mockResolvedValue({ result: 'ok' });

      await deleteFileByUrl(
        'https://res.cloudinary.com/demo/video/upload/v123/myvideo.mp4',
        'video',
      );

      expect(cloudinaryConfig.uploader.destroy).toHaveBeenCalledWith(
        'myvideo',
        { resource_type: 'video' },
      );
    });
  });
});
