import { PICTURES_CONFIG } from '../utils/general/constants.js';
import multerConfig from '../utils/libs/multer/multerConfig.js';

const uploadUserProfilePhoto = multerConfig({
  allowedMimes: PICTURES_CONFIG.allowedMimeTypes,
  errorMessage: 'Only JPG, PNG and WEBP images are allowed',
  sizeLimitInMB: PICTURES_CONFIG.sizeLimitInMB,
}).single('image');

export default uploadUserProfilePhoto;
