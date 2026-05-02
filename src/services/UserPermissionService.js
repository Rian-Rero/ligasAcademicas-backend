import UserPermissionModel from '../models/UserPermissionModel.js';
import UserModel from '../models/UserModel.js';
import RoleModel from '../models/RoleModel.js';
import PermissionModel from '../models/PermissionModel.js';
import { NotFoundError } from '../errors/baseErrors.js';

const populateUserPermissionQuery = (query) =>
  UserPermissionModel.findOne(query)
    .populate({
      path: 'roles',
      populate: 'permissions',
    })
    .populate('permissions')
    .lean()
    .exec();

const buildUserPermissionQuery = (userId, academicLeague = null) => {
  const query = { user: userId };

  if (academicLeague) {
    query.academicLeague = academicLeague;
  } else {
    query.academicLeague = null;
  }

  return query;
};

export const getUserRoleKeys = async (userId, academicLeague = null) => {
  const user = await UserModel.findById(userId).lean().exec();

  if (!user) {
    throw new NotFoundError('Usuário não encontrado');
  }

  const query = buildUserPermissionQuery(userId, academicLeague);

  const userPermission = await UserPermissionModel.findOne(query)
    .populate('roles')
    .lean()
    .exec();

  return userPermission?.roles?.map((role) => role.key).filter(Boolean) || [];
};

export const getUserPermissionDetails = async (
  userId,
  academicLeague = null,
) => {
  const user = await UserModel.findById(userId).lean().exec();

  if (!user) {
    throw new NotFoundError('Usuário não encontrado');
  }

  const query = buildUserPermissionQuery(userId, academicLeague);

  return populateUserPermissionQuery(query);
};

export const userHasRole = async (userId, roleKey, academicLeague = null) => {
  const user = await UserModel.findById(userId).lean().exec();

  if (!user) {
    throw new NotFoundError('Usuário não encontrado');
  }

  const roleKeys = await getUserRoleKeys(userId, academicLeague);

  return roleKeys.includes(roleKey);
};

/**
 * Obter permissões de um usuário (combinando papéis e permissões diretas)
 */
export const getUserPermissions = async (userId, academicLeague = null) => {
  const user = await UserModel.findById(userId).lean().exec();

  if (!user) {
    throw new NotFoundError('Usuário não encontrado');
  }

  // Se for admin global, retornar todas as permissões
  if (await userHasRole(userId, 'admin')) {
    return PermissionModel.find().lean().exec();
  }

  const query = { user: userId };
  if (academicLeague) {
    query.$or = [{ academicLeague: null }, { academicLeague }];
  }

  const userPermission = await UserPermissionModel.findOne(query)
    .populate({
      path: 'roles',
      populate: 'permissions',
    })
    .populate('permissions')
    .lean()
    .exec();

  if (!userPermission) {
    return [];
  }

  // Combinar permissões dos papéis com permissões diretas
  const allPermissions = new Set();

  if (userPermission.roles && userPermission.roles.length > 0) {
    userPermission.roles.forEach((role) => {
      if (role.permissions && role.permissions.length > 0) {
        role.permissions.forEach((permission) => {
          allPermissions.add(permission._id?.toString());
        });
      }
    });
  }

  if (userPermission.permissions && userPermission.permissions.length > 0) {
    userPermission.permissions.forEach((permission) => {
      allPermissions.add(permission._id?.toString());
    });
  }

  // Buscar os detalhes das permissões
  if (allPermissions.size === 0) {
    return [];
  }

  const permissionIds = Array.from(allPermissions).map(
    (id) => new (require('mongoose').Types.ObjectId)(id),
  );

  return PermissionModel.find({ _id: { $in: permissionIds } })
    .lean()
    .exec();
};

/**
 * Verificar se um usuário tem uma permissão específica
 */
export const userHasPermission = async (
  userId,
  permissionKey,
  academicLeague = null,
) => {
  const user = await UserModel.findById(userId).lean().exec();

  if (!user) {
    throw new NotFoundError('Usuário não encontrado');
  }

  // Admin tem todas as permissões
  if (await userHasRole(userId, 'admin')) {
    return true;
  }

  const permissions = await getUserPermissions(userId, academicLeague);

  return permissions.some((p) => p.key === permissionKey);
};

/**
 * Atualizar permissões de um usuário
 */
export const updateUserPermissions = async (
  userId,
  { roles, permissions, academicLeague },
) => {
  const user = await UserModel.findById(userId).lean().exec();

  if (!user) {
    throw new NotFoundError('Usuário não encontrado');
  }

  const query = buildUserPermissionQuery(userId, academicLeague);

  let userPermission = await UserPermissionModel.findOne(query).exec();

  if (!userPermission) {
    userPermission = await UserPermissionModel.create({
      user: userId,
      roles: roles || [],
      permissions: permissions || [],
      academicLeague: academicLeague || null,
    });
  } else {
    userPermission.roles = roles || userPermission.roles;
    userPermission.permissions = permissions || userPermission.permissions;
    await userPermission.save();
  }

  return populateUserPermissionQuery({ _id: userPermission._id });
};

/**
 * Adicionar papel a um usuário
 */
export const addRoleToUser = async (userId, roleId, academicLeague = null) => {
  const user = await UserModel.findById(userId).lean().exec();

  if (!user) {
    throw new NotFoundError('Usuário não encontrado');
  }

  const role = await RoleModel.findById(roleId).lean().exec();

  if (!role) {
    throw new NotFoundError('Papel não encontrado');
  }

  const query = buildUserPermissionQuery(userId, academicLeague);

  let userPermission = await UserPermissionModel.findOne(query).exec();

  if (!userPermission) {
    userPermission = await UserPermissionModel.create({
      user: userId,
      roles: [roleId],
      permissions: [],
      academicLeague: academicLeague || null,
    });
  } else if (!userPermission.roles.includes(roleId)) {
    userPermission.roles.push(roleId);
    await userPermission.save();
  }

  return populateUserPermissionQuery({ _id: userPermission._id });
};

/**
 * Remover papel de um usuário
 */
export const removeRoleFromUser = async (
  userId,
  roleId,
  academicLeague = null,
) => {
  const user = await UserModel.findById(userId).lean().exec();

  if (!user) {
    throw new NotFoundError('Usuário não encontrado');
  }

  const query = buildUserPermissionQuery(userId, academicLeague);

  const userPermission = await UserPermissionModel.findOne(query).exec();

  if (userPermission) {
    userPermission.roles = userPermission.roles.filter(
      (id) => id.toString() !== roleId.toString(),
    );
    await userPermission.save();
  }

  return userPermission?._id
    ? populateUserPermissionQuery({ _id: userPermission._id })
    : null;
};

/**
 * Adicionar permissão direta a um usuário
 */
export const addPermissionToUser = async (
  userId,
  permissionId,
  academicLeague = null,
) => {
  const user = await UserModel.findById(userId).lean().exec();

  if (!user) {
    throw new NotFoundError('Usuário não encontrado');
  }

  const permission = await PermissionModel.findById(permissionId).lean().exec();

  if (!permission) {
    throw new NotFoundError('Permissão não encontrada');
  }

  const query = buildUserPermissionQuery(userId, academicLeague);

  let userPermission = await UserPermissionModel.findOne(query).exec();

  if (!userPermission) {
    userPermission = await UserPermissionModel.create({
      user: userId,
      roles: [],
      permissions: [permissionId],
      academicLeague: academicLeague || null,
    });
  } else if (
    !userPermission.permissions.some(
      (id) => id.toString() === permissionId.toString(),
    )
  ) {
    userPermission.permissions.push(permissionId);
    await userPermission.save();
  }

  return populateUserPermissionQuery({ _id: userPermission._id });
};

/**
 * Remover permissão direta de um usuário
 */
export const removePermissionFromUser = async (
  userId,
  permissionId,
  academicLeague = null,
) => {
  const user = await UserModel.findById(userId).lean().exec();

  if (!user) {
    throw new NotFoundError('Usuário não encontrado');
  }

  const query = buildUserPermissionQuery(userId, academicLeague);

  const userPermission = await UserPermissionModel.findOne(query).exec();

  if (userPermission) {
    userPermission.permissions = userPermission.permissions.filter(
      (id) => id.toString() !== permissionId.toString(),
    );
    await userPermission.save();
  }

  return userPermission?._id
    ? populateUserPermissionQuery({ _id: userPermission._id })
    : null;
};
