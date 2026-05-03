import { PICTURES_CONFIG } from '../utils/general/constants.js';
import multerConfig from '../utils/libs/multer/multerConfig.js';

const uploadUniversityLogo = multerConfig({
  allowedMimes: PICTURES_CONFIG.allowedMimeTypes,
  errorMessage: 'Only JPG, PNG and WEBP images are allowed',
  sizeLimitInMB: PICTURES_CONFIG.sizeLimitInMB,
}).single('logo');

export default uploadUniversityLogo;
