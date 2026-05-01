import PermissionModel from '../models/PermissionModel.js';
import RoleModel from '../models/RoleModel.js';
import { NotFoundError, ConflictError } from '../errors/baseErrors.js';

export const get = async (filters) => {
  return PermissionModel.find(filters).lean().exec();
};

export const getById = async (_id) => {
  const permission = await PermissionModel.findById(_id).lean().exec();

  if (!permission) {
    throw new NotFoundError('Permissão não encontrada');
  }

  return permission;
};

export const create = async (inputData) => {
  // Verificar se a chave já existe
  const existingPermission = await PermissionModel.findOne({
    key: inputData.key,
  })
    .lean()
    .exec();

  if (existingPermission) {
    throw new ConflictError('Já existe uma permissão com esta chave');
  }

  const newPermission = await PermissionModel.create(inputData);

  return newPermission.toObject();
};

export const update = async ({ _id, inputData }) => {
  // Verificar se a permissão é do sistema
  const permission = await PermissionModel.findById(_id).lean().exec();

  if (!permission) {
    throw new NotFoundError('Permissão não encontrada');
  }

  if (permission.isSystem) {
    throw new ConflictError('Não é possível editar permissões do sistema');
  }

  // Verificar se nova chave já existe (se estiver sendo alterada)
  if (inputData.key && inputData.key !== permission.key) {
    const existingPermission = await PermissionModel.findOne({
      key: inputData.key,
    })
      .lean()
      .exec();

    if (existingPermission) {
      throw new ConflictError('Já existe uma permissão com esta chave');
    }
  }

  const updatedPermission = await PermissionModel.findByIdAndUpdate(
    _id,
    inputData,
    {
      new: true,
    },
  )
    .lean()
    .exec();

  return updatedPermission;
};

export const destroy = async (_id) => {
  const permission = await PermissionModel.findById(_id).lean().exec();

  if (!permission) {
    throw new NotFoundError('Permissão não encontrada');
  }

  if (permission.isSystem) {
    throw new ConflictError('Não é possível deletar permissões do sistema');
  }

  // Remover a permissão de todos os papéis
  await RoleModel.updateMany(
    { permissions: _id },
    { $pull: { permissions: _id } },
  ).exec();

  return PermissionModel.findByIdAndDelete(_id).exec();
};

/**
 * Seed inicial de permissões do sistema
 */
export const seedSystemPermissions = async () => {
  const systemPermissions = [
    // Permissões de Usuário
    {
      key: 'user.create',
      name: 'Criar Usuários',
      description: 'Permite criar novos usuários no sistema',
      module: 'user',
      isSystem: true,
    },
    {
      key: 'user.view',
      name: 'Visualizar Usuários',
      description: 'Permite visualizar informações de usuários',
      module: 'user',
      isSystem: true,
    },
    {
      key: 'user.edit',
      name: 'Editar Usuários',
      description: 'Permite editar informações de usuários',
      module: 'user',
      isSystem: true,
    },
    {
      key: 'user.delete',
      name: 'Deletar Usuários',
      description: 'Permite deletar usuários',
      module: 'user',
      isSystem: true,
    },
    // Permissões de Papéis
    {
      key: 'role.create',
      name: 'Criar Papéis',
      description: 'Permite criar novos papéis',
      module: 'role',
      isSystem: true,
    },
    {
      key: 'role.view',
      name: 'Visualizar Papéis',
      description: 'Permite visualizar papéis',
      module: 'role',
      isSystem: true,
    },
    {
      key: 'role.edit',
      name: 'Editar Papéis',
      description: 'Permite editar papéis',
      module: 'role',
      isSystem: true,
    },
    {
      key: 'role.delete',
      name: 'Deletar Papéis',
      description: 'Permite deletar papéis',
      module: 'role',
      isSystem: true,
    },
    // Permissões de Permissões
    {
      key: 'permission.view',
      name: 'Visualizar Permissões',
      description: 'Permite visualizar permissões disponíveis',
      module: 'permission',
      isSystem: true,
    },
    {
      key: 'permission.create',
      name: 'Criar Permissões',
      description: 'Permite criar novas permissões',
      module: 'permission',
      isSystem: true,
    },
    {
      key: 'permission.edit',
      name: 'Editar Permissões',
      description: 'Permite editar permissões',
      module: 'permission',
      isSystem: true,
    },
    {
      key: 'permission.delete',
      name: 'Deletar Permissões',
      description: 'Permite deletar permissões',
      module: 'permission',
      isSystem: true,
    },
    // Permissões de Eventos
    {
      key: 'event.create',
      name: 'Criar Eventos',
      description: 'Permite criar novos eventos',
      module: 'event',
      isSystem: true,
    },
    {
      key: 'event.view',
      name: 'Visualizar Eventos',
      description: 'Permite visualizar eventos',
      module: 'event',
      isSystem: true,
    },
    {
      key: 'event.edit',
      name: 'Editar Eventos',
      description: 'Permite editar eventos',
      module: 'event',
      isSystem: true,
    },
    {
      key: 'event.delete',
      name: 'Deletar Eventos',
      description: 'Permite deletar eventos',
      module: 'event',
      isSystem: true,
    },
    // Permissões de Presença
    {
      key: 'attendance.view',
      name: 'Visualizar Presenças',
      description: 'Permite visualizar presenças',
      module: 'attendance',
      isSystem: true,
    },
    {
      key: 'attendance.manage',
      name: 'Gerenciar Presenças',
      description: 'Permite marcar/editar presenças',
      module: 'attendance',
      isSystem: true,
    },
    // Permissões de Certificados
    {
      key: 'certificate.create',
      name: 'Criar Certificados',
      description: 'Permite criar/gerar certificados',
      module: 'certificate',
      isSystem: true,
    },
    {
      key: 'certificate.view',
      name: 'Visualizar Certificados',
      description: 'Permite visualizar certificados',
      module: 'certificate',
      isSystem: true,
    },
    // Permissões de Squad
    {
      key: 'squad.manage',
      name: 'Gerenciar Squads',
      description: 'Permite gerenciar squads',
      module: 'squad',
      isSystem: true,
    },
    // Permissões de Liga Acadêmica
    {
      key: 'academicLeague.create',
      name: 'Criar Ligas',
      description: 'Permite criar novas ligas acadêmicas',
      module: 'academicLeague',
      isSystem: true,
    },
    {
      key: 'academicLeague.manage',
      name: 'Gerenciar Ligas',
      description: 'Permite gerenciar ligas acadêmicas',
      module: 'academicLeague',
      isSystem: true,
    },
    // Permissões de Sistema
    {
      key: 'system.admin',
      name: 'Acesso Administrativo',
      description: 'Acesso total ao sistema',
      module: 'system',
      isSystem: true,
    },
  ];

  for (const permission of systemPermissions) {
    const exists = await PermissionModel.findOne({
      key: permission.key,
    })
      .lean()
      .exec();

    if (!exists) {
      await PermissionModel.create(permission);
    }
  }
};
