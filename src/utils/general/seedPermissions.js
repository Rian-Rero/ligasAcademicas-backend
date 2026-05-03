import PermissionModel from '../../models/PermissionModel.js';
import * as PermissionService from '../../services/PermissionService.js';
import * as RoleService from '../../services/RoleService.js';
import logger from '../../config/logger.js';

/**
 * Função para fazer seed inicial de permissões e papéis do sistema
 */
export const seedSystemPermissionsAndRoles = async () => {
  try {
    // Verificar se já existe alguma permissão de sistema
    const existingSystemPermission = await PermissionModel.findOne({
      isSystem: true,
    })
      .lean()
      .exec();

    logger.info('Starting seed/sync of system permissions and roles...');

    if (!existingSystemPermission) {
      // Seed permissões apenas na primeira inicialização
      await PermissionService.seedSystemPermissions();
      logger.info('✅ System permissions seeded successfully');
    } else {
      logger.info('System permissions already seeded, skipping permissions');
    }

    // Sempre sincroniza papéis de sistema (admin/manager)
    await RoleService.seedSystemRoles();
    logger.info('✅ System roles synced successfully');

    logger.info('✅ System permissions and roles seeded completely');
  } catch (error) {
    logger.error(
      `Error during seed of system permissions and roles: ${error.message}`,
    );
    // Não lançar erro para não quebrar a inicialização da app
  }
};
