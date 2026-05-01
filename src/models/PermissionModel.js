import mongoose from 'mongoose';

import { COLLECTION_NAMES } from '../utils/general/constants.js';

const PermissionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // Formato: module.action (ex: 'user.create', 'event.view')
    },
    name: {
      type: String,
      required: true,
      trim: true,
      // Nome legível (ex: 'Criar Usuários')
    },
    description: {
      type: String,
      required: false,
      trim: true,
      // Descrição detalhada da permissão
    },
    module: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'user',
        'role',
        'permission',
        'event',
        'attendance',
        'certificate',
        'squad',
        'academicLeague',
        'leagueMembership',
        'university',
        'session',
        'system',
      ],
      // Módulo ao qual a permissão pertence
    },
    isSystem: {
      type: Boolean,
      required: false,
      default: false,
      // Se verdadeiro, não pode ser deletada
    },
  },
  { timestamps: true, versionKey: false },
);

const PermissionModel = mongoose.model(
  COLLECTION_NAMES.PERMISSION,
  PermissionSchema,
);
export default PermissionModel;
