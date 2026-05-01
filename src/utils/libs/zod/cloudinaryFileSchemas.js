import { z } from 'zod';

export const cloudinaryFileSchema = z.object({
  key: z.string({ required_error: 'Cloudinary file key is required' }),
  url: z.string({ required_error: 'Cloudinary file url is required' }),
});

export const cloudinaryImageSchema = cloudinaryFileSchema;
