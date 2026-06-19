import AcademicLeagueModel from '../../models/AcademicLeagueModel.js';
import LeagueMembershipModel from '../../models/LeagueMembershipModel.js';
import PermissionModel from '../../models/PermissionModel.js';
import RoleModel from '../../models/RoleModel.js';
import UniversityModel from '../../models/UniversityModel.js';
import UserModel from '../../models/UserModel.js';
import UserPermissionModel from '../../models/UserPermissionModel.js';

let counter = 0;
function uid() {
  counter += 1;
  return counter;
}

export async function createUser(overrides = {}) {
  const n = uid();
  return UserModel.create({
    name: `User ${n}`,
    email: `user${n}@sgla-test.com`,
    password: 'Password@1',
    emailVerified: true,
    ...overrides,
  });
}

export async function createUniversity(overrides = {}) {
  const n = uid();
  return UniversityModel.create({
    name: `University ${n}`,
    street: `Rua ${n}`,
    number: n,
    ...overrides,
  });
}

export async function createAcademicLeague(universityId, overrides = {}) {
  const n = uid();
  return AcademicLeagueModel.create({
    university: universityId,
    name: `League ${n}`,
    description: `Description ${n}`,
    ...overrides,
  });
}

export async function createLeagueMembership(
  userId,
  academicLeagueId,
  overrides = {},
) {
  return LeagueMembershipModel.create({
    user: userId,
    academicLeague: academicLeagueId,
    role: 'member',
    isActive: true,
    ...overrides,
  });
}

export async function createRole(overrides = {}) {
  const n = uid();
  return RoleModel.create({
    name: `Role ${n}`,
    key: `role_${n}`,
    ...overrides,
  });
}

export async function createPermission(overrides = {}) {
  const n = uid();
  return PermissionModel.create({
    name: `Permission ${n}`,
    key: `event.action_${n}`,
    module: 'event',
    description: `Permission description ${n}`,
    ...overrides,
  });
}

export async function createAdminUser() {
  const user = await createUser({
    name: 'Admin User',
    email: `admin${uid()}@sgla-test.com`,
  });
  // Find or create admin role (key is unique, so reuse if it already exists in this test run)
  let adminRole = await RoleModel.findOne({ key: 'admin' }).exec();
  if (!adminRole) {
    adminRole = await RoleModel.create({
      name: 'Admin',
      key: 'admin',
      isSystem: true,
      isGlobal: true,
    });
  }
  await UserPermissionModel.create({
    user: user._id,
    roles: [adminRole._id],
    permissions: [],
    academicLeague: null,
  });
  return user;
}
