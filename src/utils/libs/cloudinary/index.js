import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import path from 'node:path';

import isDevEnvironment from '../../general/isDevEnvironment.js';

// Configure cloudinary if env vars are present; prefer CLOUDINARY_URL
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
} else if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadFile({
  filePath,
  publicId,
  resourceType = 'image',
}) {
  if (isDevEnvironment) {
    // In dev we keep files in temp/uploads and return a simulated public id and url
    const fileName = path.basename(filePath);
    const key = publicId || fileName;
    const url = `/temp/uploads/${encodeURIComponent(fileName)}`;
    return { key, url };
  }

  const options = {
    resource_type: resourceType,
    public_id: publicId,
    overwrite: true,
    folder: process.env.CLOUDINARY_FOLDER || undefined,
  };

  const result = await cloudinary.uploader.upload(filePath, options);
  return { key: result.public_id, url: result.secure_url };
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

export default {
  uploadFile,
  deleteFile,
};
