import multer from 'multer';

import { BadRequest } from '../../../errors/baseErrors.js';
import numToMegaBytes from '../../general/numToMegaBytes.js';

export default function multerConfig({
  allowedMimes = [],
  errorMessage,
  sizeLimitInMB,
  storage = multer.memoryStorage(),
} = {}) {
  const fileFilter = (_req, file, cb) => {
    if (!allowedMimes.includes(file.mimetype)) {
      cb(
        new BadRequest(
          errorMessage || `${file.fieldname} mime type is invalid`,
        ),
      );
      return;
    }

    cb(null, true);
  };

  return multer({
    storage,
    limits: sizeLimitInMB
      ? { fileSize: numToMegaBytes(sizeLimitInMB) }
      : undefined,
    fileFilter,
  });
}
