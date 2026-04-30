import { MANAGER_ROLE_KEYWORDS } from './constants.js';

export function hasManagerRole(role) {
  if (!role) return false;

  const normalizedRole = String(role).trim().toLocaleLowerCase('pt-BR');
  return MANAGER_ROLE_KEYWORDS.some((keyword) =>
    normalizedRole.includes(keyword),
  );
}
