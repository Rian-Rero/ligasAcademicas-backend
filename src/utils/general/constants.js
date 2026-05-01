// Supported success response status code
export const SUCCESS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
};

// Supported error response status codes and names
export const ERROR_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER: 500,
};
export const ERROR_NAMES = {
  BAD_REQUEST: 'BadRequest',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'NotFound',
  VALIDATION_ERROR: 'ValidationError',
  INTERNAL_SERVER: 'InternalServerError',
};

// Application supported exit status
export const EXIT_STATUS = {
  SUCCESS: 0,
  FAILURE: 1,
};

// Table names
export const COLLECTION_NAMES = {
  USER: 'users',
  USER_SESSION_TOKEN: 'usersessiontokens',
  USER_PWD_TOKEN: 'userpwdtokens',
  UNIVERSITY: 'universities',
  ACADEMIC_LEAGUE: 'academicleagues',
  SQUAD: 'squads',
  LEAGUE_MEMBERSHIP: 'leaguememberships',
  EVENT: 'events',
  ATTENDANCE: 'attendances',
  CERTIFICATE: 'certificates',
  ROLE_HISTORY: 'rolehistories',
  PERMISSION: 'permissions',
  ROLE: 'roles',
  USER_PERMISSION: 'userpermissions',
};

export const MANAGER_ROLE_KEYWORDS = ['admin', 'manager'];

export const PICTURES_CONFIG = {
  fileName: 'Picture',
  allowedMimeTypes: [
    'image/jpeg',
    'image/pjpeg',
    'image/png',
    'image/webp',
    'image/jpg',
  ],
  sizeLimitInMB: 5,
};
