import { ForbiddenError } from '../errors/baseErrors.js';
import asyncHandler from '../utils/general/asyncHandler.js';
import * as UserPermissionService from '../services/UserPermissionService.js';

/**
 * Middleware que verifica se o usuário tem uma permissão específica
 * Uso: verifyPermission('user.create')
 */
export const verifyPermission = (requiredPermission) =>
  asyncHandler(async (req, res, next) => {
    const user = req.user;

    if (!user) {
      throw new ForbiddenError('Usuário não autenticado');
    }

    // Admin tem acesso a tudo
    if (user.globalRole === 'admin') {
      next();
      return;
    }

    // Extrair academicLeague se disponível
    const academicLeague =
      req.params?.academicLeague ||
      req.params?.academicLeagueId ||
      req.body?.academicLeague ||
      req.body?.academicLeagueId;

    const hasPermission = await UserPermissionService.userHasPermission(
      user._id,
      requiredPermission,
      academicLeague || null,
    );

    if (!hasPermission) {
      throw new ForbiddenError(
        `Você não tem permissão para: ${requiredPermission}`,
      );
    }

    next();
  });

/**
 * Middleware que verifica se o usuário tem acesso ao painel de gerenciamento de permissões
 * Apenas admin e usuários com permissão 'permission.manage' podem acessar
 */
export const verifyPermissionAdmin = asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (!user) {
    throw new ForbiddenError('Usuário não autenticado');
  }

  // Admin tem acesso a tudo
  if (user.globalRole === 'admin') {
    next();
    return;
  }

  const hasPermission = await UserPermissionService.userHasPermission(
    user._id,
    'system.admin',
    null,
  );

  if (!hasPermission) {
    throw new ForbiddenError('Acesso ao painel de permissões negado');
  }

  next();
});

/**
 * Middleware que verifica múltiplas permissões (ANY - pelo menos uma)
 */
export const verifyAnyPermission = (permissions) =>
  asyncHandler(async (req, res, next) => {
    const user = req.user;

    if (!user) {
      throw new ForbiddenError('Usuário não autenticado');
    }

    // Admin tem acesso a tudo
    if (user.globalRole === 'admin') {
      next();
      return;
    }

    const academicLeague =
      req.params?.academicLeague ||
      req.params?.academicLeagueId ||
      req.body?.academicLeague ||
      req.body?.academicLeagueId;

    for (const permission of permissions) {
      const hasPermission = await UserPermissionService.userHasPermission(
        user._id,
        permission,
        academicLeague || null,
      );

      if (hasPermission) {
        next();
        return;
      }
    }

    throw new ForbiddenError('Você não tem nenhuma das permissões necessárias');
  });

/**
 * Middleware que verifica múltiplas permissões (ALL - todas as permissões)
 */
export const verifyAllPermissions = (permissions) =>
  asyncHandler(async (req, res, next) => {
    const user = req.user;

    if (!user) {
      throw new ForbiddenError('Usuário não autenticado');
    }

    // Admin tem acesso a tudo
    if (user.globalRole === 'admin') {
      next();
      return;
    }

    const academicLeague =
      req.params?.academicLeague ||
      req.params?.academicLeagueId ||
      req.body?.academicLeague ||
      req.body?.academicLeagueId;

    for (const permission of permissions) {
      const hasPermission = await UserPermissionService.userHasPermission(
        user._id,
        permission,
        academicLeague || null,
      );

      if (!hasPermission) {
        throw new ForbiddenError(
          `Você não tem a permissão necessária: ${permission}`,
        );
      }
    }

    next();
  });
