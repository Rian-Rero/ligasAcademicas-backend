import * as PermissionService from '../../services/PermissionService.js';
import * as RoleService from '../../services/RoleService.js';
import logger from '../../config/logger.js';

/**
 * Função para fazer seed inicial de permissões e papéis do sistema
 */
export const seedSystemPermissionsAndRoles = async () => {
  try {
    logger.info('Starting seed/sync of system permissions and roles...');

    await PermissionService.seedSystemPermissions();
    logger.info('✅ System permissions ensured/seeded');

    await RoleService.seedSystemRoles();
    logger.info('✅ System roles synced successfully');

    logger.info('✅ System permissions and roles seeded completely');
  } catch (error) {
    logger.error(
      `Error during seed of system permissions and roles: ${error.message}`,
    );
  }
};
