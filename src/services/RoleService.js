import RoleModel from '../models/RoleModel.js';
import PermissionModel from '../models/PermissionModel.js';
import UserPermissionModel from '../models/UserPermissionModel.js';
import { NotFoundError, ConflictError } from '../errors/baseErrors.js';
import { permissions } from '../utils/general/constants.js';

export const get = async (filters) => {
  return RoleModel.find(filters)
    .populate('permissions', 'key name description module')
    .lean()
    .exec();
};

export const getById = async (_id) => {
  const role = await RoleModel.findById(_id)
    .populate('permissions', 'key name description module')
    .lean()
    .exec();

  if (!role) {
    throw new NotFoundError('Papel não encontrado');
  }

  return role;
};

export const create = async (inputData) => {
  // Verificar se a chave já existe
  const existingRole = await RoleModel.findOne({ key: inputData.key })
    .lean()
    .exec();

  if (existingRole) {
    throw new ConflictError('Já existe um papel com esta chave');
  }

  const newRole = await RoleModel.create(inputData);

  return RoleModel.findById(newRole._id)
    .populate('permissions', 'key name description module')
    .lean()
    .exec();
};

export const update = async ({ _id, inputData }) => {
  const role = await RoleModel.findById(_id).lean().exec();

  if (!role) {
    throw new NotFoundError('Papel não encontrado');
  }

  if (role.isSystem) {
    throw new ConflictError('Não é possível editar papéis do sistema');
  }

  const updatedRole = await RoleModel.findByIdAndUpdate(_id, inputData, {
    new: true,
  })
    .populate('permissions', 'key name description module')
    .lean()
    .exec();

  return updatedRole;
};

export const destroy = async (_id) => {
  const role = await RoleModel.findById(_id).lean().exec();

  if (!role) {
    throw new NotFoundError('Papel não encontrado');
  }

  if (role.isSystem) {
    throw new ConflictError('Não é possível deletar papéis do sistema');
  }

  // Remover o papel de todos os usuários
  await UserPermissionModel.updateMany(
    { roles: _id },
    { $pull: { roles: _id } },
  ).exec();

  return RoleModel.findByIdAndDelete(_id).exec();
};

export const addPermissionToRole = async (roleId, permissionId) => {
  const role = await RoleModel.findById(roleId).exec();

  if (!role) {
    throw new NotFoundError('Papel não encontrado');
  }

  const permission = await PermissionModel.findById(permissionId).lean().exec();

  if (!permission) {
    throw new NotFoundError('Permissão não encontrada');
  }

  if (role.permissions.includes(permissionId)) {
    throw new ConflictError('Este papel já possui esta permissão');
  }

  role.permissions.push(permissionId);
  await role.save();

  return RoleModel.findById(roleId)
    .populate('permissions', 'key name description module')
    .lean()
    .exec();
};

export const removePermissionFromRole = async (roleId, permissionId) => {
  const role = await RoleModel.findById(roleId).exec();

  if (!role) {
    throw new NotFoundError('Papel não encontrado');
  }

  role.permissions = role.permissions.filter(
    (id) => id.toString() !== permissionId.toString(),
  );
  await role.save();

  return RoleModel.findById(roleId)
    .populate('permissions', 'key name description module')
    .lean()
    .exec();
};

/**
 * Seed de papéis do sistema
 */
export const seedSystemRoles = async () => {
  const adminPermissions = await PermissionModel.find({ isSystem: true })
    .lean()
    .exec();

  const managerPermissionKeys = [
    // Eventos
    permissions.event.create,
    permissions.event.view,
    permissions.event.edit,
    permissions.event.delete,
    // Presenças
    permissions.attendance.create,
    permissions.attendance.view,
    permissions.attendance.edit,
    // Certificados
    permissions.certificate.create,
    permissions.certificate.view,
    permissions.certificate.edit,
    // Subequipes
    permissions.squad.create,
    permissions.squad.view,
    permissions.squad.edit,
    permissions.squad.delete,
    // Membros de liga
    permissions.leagueMembership.create,
    permissions.leagueMembership.view,
    permissions.leagueMembership.edit,
    // Contexto institucional usado nas telas de gestão
    permissions.academicLeague.view,
    permissions.university.view,
    // Tarefas
    permissions.task.create,
    permissions.task.view,
    permissions.task.edit,
    permissions.task.delete,
  ];

  const systemRoles = [
    {
      name: 'Administrador',
      key: 'admin',
      description:
        'Acesso total ao sistema. Pode gerenciar usuários, papéis e permissões.',
      isSystem: true,
      isGlobal: true,
      permissions: adminPermissions.map((p) => p._id),
      priority: 100,
      color: '#EF4444',
    },
    {
      name: 'Gerenciador',
      key: 'manager',
      description:
        'Pode gerenciar operações da liga: eventos, membros, subequipes, tarefas e certificados.',
      isSystem: true,
      isGlobal: true,
      permissions: adminPermissions
        .filter((p) => managerPermissionKeys.includes(p.key))
        .map((p) => p._id),
      priority: 90,
      color: '#3B82F6',
    },
  ];

  for (const role of systemRoles) {
    const exists = await RoleModel.findOne({ key: role.key }).lean().exec();

    if (!exists) {
      await RoleModel.create(role);
      continue;
    }

    // Sincroniza papéis de sistema já existentes (especialmente manager/admin)
    if (exists.isSystem) {
      await RoleModel.findByIdAndUpdate(exists._id, {
        name: role.name,
        description: role.description,
        isGlobal: role.isGlobal,
        permissions: role.permissions,
        priority: role.priority,
        color: role.color,
      }).exec();
    }
  }
};
