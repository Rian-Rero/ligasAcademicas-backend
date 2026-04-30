import multer from 'multer';

import { BadRequest } from '../errors/baseErrors.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const FIVE_MB = 5 * 1024 * 1024;

const uploadUserProfilePhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FIVE_MB },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new BadRequest('Only JPG, PNG and WEBP images are allowed'));
      return;
    }

    cb(null, true);
  },
}).single('image');

export default uploadUserProfilePhoto;
