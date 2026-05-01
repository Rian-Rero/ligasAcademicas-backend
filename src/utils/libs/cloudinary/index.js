import fs from 'fs/promises';
import path from 'node:path';

import isDevEnvironment from '../../general/isDevEnvironment.js';
import cloudinary from './config.js';

function getPublicIdFromUrl(fileUrl) {
  if (!fileUrl) return null;

  if (fileUrl.startsWith('/')) {
    return decodeURIComponent(path.basename(fileUrl));
  }

  try {
    const url = new URL(fileUrl);
    const uploadPath = url.pathname.split('/upload/')[1];

    if (!uploadPath) return null;

    const publicIdWithExtension = uploadPath.replace(/^v\d+\//, '');
    const lastDotIndex = publicIdWithExtension.lastIndexOf('.');

    return lastDotIndex > 0
      ? publicIdWithExtension.slice(0, lastDotIndex)
      : publicIdWithExtension;
  } catch {
    return null;
  }
}

export async function uploadFile({
  filePath,
  fileBuffer,
  fileName,
  publicId,
  resourceType = 'image',
}) {
  if (isDevEnvironment) {
    // In dev we persist uploads locally and return a local URL.
    const resolvedFileName = fileName || path.basename(filePath || publicId);
    const uploadsDir = path.resolve(process.cwd(), 'temp/uploads');

    await fs.mkdir(uploadsDir, { recursive: true });

    const localPath = path.resolve(uploadsDir, resolvedFileName);
    if (fileBuffer) {
      await fs.writeFile(localPath, fileBuffer);
    }

    const key = publicId || resolvedFileName;
    const url = `/temp/uploads/${encodeURIComponent(resolvedFileName)}`;
    return { key, url };
  }

  const options = {
    resource_type: resourceType,
    public_id: publicId,
    overwrite: true,
    folder: process.env.CLOUDINARY_FOLDER || undefined,
  };

  if (fileBuffer) {
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(result);
        },
      );

      stream.end(fileBuffer);
    });

    return { key: uploadResult.public_id, url: uploadResult.secure_url };
  }

  const result = await cloudinary.uploader.upload(filePath, options);
  return { key: result.public_id, url: result.secure_url };
}

export async function uploadFiles(files, options = {}) {
  return Promise.all(files.map((file) => uploadFile({ ...file, ...options })));
}

export async function deleteFile(key, resourceType = 'image') {
  if (!key) return null;

  if (isDevEnvironment) {
    // Remove file from temp/uploads if it exists (key is file name in dev)
    try {
      // Try a couple of likely upload directories used by s3rver
      const candidates = [
        path.resolve(process.cwd(), 'temp/uploads'),
        path.resolve(process.cwd(), 'src/temp/uploads'),
      ];
      await Promise.all(
        candidates.map(async (uploadsDir) => {
          const filePath = path.join(uploadsDir, key);
          await fs.unlink(filePath).catch(() => null);
        }),
      );
    } catch {
      // ignore
    }
    return null;
  }

  // Production: remove from Cloudinary

  const res = await cloudinary.uploader.destroy(key, {
    resource_type: resourceType,
  });
  return res;
}

export async function deleteFiles(keys, resourceType = 'image') {
  return Promise.all(keys.map((key) => deleteFile(key, resourceType)));
}

export async function deleteFileByUrl(fileUrl, resourceType = 'image') {
  const key = getPublicIdFromUrl(fileUrl);
  if (!key) return null;

  return deleteFile(key, resourceType);
}

export default {
  uploadFile,
  uploadFiles,
  deleteFile,
  deleteFiles,
  deleteFileByUrl,
};
