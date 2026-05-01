import mongoose from 'mongoose';

import { COLLECTION_NAMES } from '../utils/general/constants.js';

const { ObjectId } = mongoose.Schema.Types;

/**
 * Papel é um conjunto de permissões
 * Um usuário pode ter múltiplos papéis (globais ou por liga)
 * Exemplo: 'admin', 'manager', 'treasurer', etc
 */
const RoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      // Nome do papel (ex: 'Gerenciador de Eventos')
    },
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      // Chave única para o papel (ex: 'event_manager')
    },
    description: {
      type: String,
      required: false,
      trim: true,
      // Descrição do papel
    },
    permissions: [
      {
        type: ObjectId,
        ref: COLLECTION_NAMES.PERMISSION,
      },
    ],
    // Permissões que este papel possui
    isSystem: {
      type: Boolean,
      required: false,
      default: false,
      // Se verdadeiro, é um papel do sistema (admin, manager) e não pode ser deletado
    },
    isGlobal: {
      type: Boolean,
      required: false,
      default: false,
      // Se verdadeiro, aplica globalmente; se falso, pode ser aplicado por liga
    },
    academicLeague: {
      type: ObjectId,
      ref: COLLECTION_NAMES.ACADEMIC_LEAGUE,
      required: false,
      default: null,
      // Se preenchido, o papel é específico desta liga
    },
    color: {
      type: String,
      required: false,
      default: '#6366F1',
      // Cor para representação visual
    },
    priority: {
      type: Number,
      required: false,
      default: 0,
      // Prioridade para exibição (papéis mais importantes aparecem primeiro)
    },
  },
  { timestamps: true, versionKey: false },
);

const RoleModel = mongoose.model(COLLECTION_NAMES.ROLE, RoleSchema);
export default RoleModel;
