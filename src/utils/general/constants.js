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
  TASK: 'tasks',
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

// Sistema de Permissões por Módulo
export const permissions = {
  user: {
    create: 'user.create',
    view: 'user.view',
    edit: 'user.edit',
    delete: 'user.delete',
  },
  role: {
    create: 'role.create',
    view: 'role.view',
    edit: 'role.edit',
    delete: 'role.delete',
  },
  permission: {
    create: 'permission.create',
    view: 'permission.view',
    edit: 'permission.edit',
    delete: 'permission.delete',
  },
  event: {
    create: 'event.create',
    view: 'event.view',
    edit: 'event.edit',
    delete: 'event.delete',
  },
  attendance: {
    create: 'attendance.create',
    view: 'attendance.view',
    edit: 'attendance.edit',
    delete: 'attendance.delete',
  },
  certificate: {
    create: 'certificate.create',
    view: 'certificate.view',
    edit: 'certificate.edit',
    delete: 'certificate.delete',
  },
  squad: {
    create: 'squad.create',
    view: 'squad.view',
    edit: 'squad.edit',
    delete: 'squad.delete',
  },
  academicLeague: {
    create: 'academicLeague.create',
    view: 'academicLeague.view',
    edit: 'academicLeague.edit',
    delete: 'academicLeague.delete',
  },
  leagueMembership: {
    create: 'leagueMembership.create',
    view: 'leagueMembership.view',
    edit: 'leagueMembership.edit',
    delete: 'leagueMembership.delete',
  },
  university: {
    create: 'university.create',
    view: 'university.view',
    edit: 'university.edit',
    delete: 'university.delete',
  },
  task: {
    create: 'task.create',
    view: 'task.view',
    edit: 'task.edit',
    delete: 'task.delete',
  },
  system: {
    admin: 'system.admin',
  },
};
