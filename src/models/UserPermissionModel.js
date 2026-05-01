import mongoose from 'mongoose';

import { COLLECTION_NAMES } from '../utils/general/constants.js';

const { ObjectId } = mongoose.Schema.Types;

/**
 * Mapeamento de permissões do usuário
 * Pode ter permissões específicas além dos papéis
 */
const UserPermissionSchema = new mongoose.Schema(
  {
    user: {
      type: ObjectId,
      ref: COLLECTION_NAMES.USER,
      required: true,
      unique: false,
    },
    // Referência ao usuário

    roles: [
      {
        type: ObjectId,
        ref: COLLECTION_NAMES.ROLE,
      },
    ],
    // Papéis globais do usuário

    permissions: [
      {
        type: ObjectId,
        ref: COLLECTION_NAMES.PERMISSION,
      },
    ],
    // Permissões adicionais específicas deste usuário

    academicLeague: {
      type: ObjectId,
      ref: COLLECTION_NAMES.ACADEMIC_LEAGUE,
      required: false,
      default: null,
    },
    // Se preenchido, estas permissões/papéis são específicos desta liga
  },
  { timestamps: true, versionKey: false },
);

// Índice composto para evitar duplicatas
UserPermissionSchema.index(
  { user: 1, academicLeague: 1 },
  { unique: true, sparse: true },
);

const UserPermissionModel = mongoose.model(
  COLLECTION_NAMES.USER_PERMISSION,
  UserPermissionSchema,
);
export default UserPermissionModel;
