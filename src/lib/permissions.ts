/**
 * Helper centralizado para verificação de permissões
 * Garante que apenas ARQUITETO pode fazer operações de escrita
 */

import { Role } from "@prisma/client";

export interface PermissionCheckResult {
  allowed: boolean;
  error?: string;
  reason?: string;
}

/**
 * Verifica se o usuário pode realizar operações de escrita
 * Apenas ARQUITETO tem permissão de escrita
 */
export function canWrite(userRole: Role | string | undefined): PermissionCheckResult {
  if (!userRole) {
    return {
      allowed: false,
      error: "Não autenticado",
      reason: "user_role_missing",
    };
  }

  if (userRole !== Role.ARQUITETO) {
    return {
      allowed: false,
      error: "Acesso negado. Apenas usuários com perfil ARQUITETO podem realizar esta operação.",
      reason: "insufficient_permissions",
    };
  }

  return {
    allowed: true,
  };
}

/**
 * Verifica se o usuário pode visualizar dados
 * ARQUITETO, ADMIN e SUPERADMIN podem ver tudo
 * MODELO e CLIENTE só veem seus próprios dados
 */
export function canRead(
  userRole: Role | string | undefined,
  resourceOwnerId?: string,
  currentUserId?: string
): PermissionCheckResult {
  if (!userRole) {
    return {
      allowed: false,
      error: "Não autenticado",
      reason: "user_role_missing",
    };
  }

  // ARQUITETO, ADMIN e SUPERADMIN podem ver tudo
  if (userRole === Role.ARQUITETO || userRole === Role.ADMIN || userRole === Role.SUPERADMIN) {
    return {
      allowed: true,
    };
  }

  // MODELO e CLIENTE só veem seus próprios dados
  if (resourceOwnerId && currentUserId && resourceOwnerId === currentUserId) {
    return {
      allowed: true,
    };
  }

  if (resourceOwnerId && currentUserId && resourceOwnerId !== currentUserId) {
    return {
      allowed: false,
      error: "Acesso negado. Você só pode visualizar seus próprios dados.",
      reason: "resource_not_owned",
    };
  }

  // Se não há resourceOwnerId, permitir (pode ser recurso público ou sem owner)
  return {
    allowed: true,
  };
}

/**
 * Verifica se o usuário pode fazer upload
 * Apenas ARQUITETO pode fazer upload
 */
export function canUpload(userRole: Role | string | undefined): PermissionCheckResult {
  return canWrite(userRole);
}

/**
 * Verifica se o usuário pode editar seu próprio perfil
 * ARQUITETO pode editar qualquer perfil
 * Outros usuários só podem editar o próprio perfil
 */
export function canEditProfile(
  userRole: Role | string | undefined,
  targetUserId: string,
  currentUserId: string
): PermissionCheckResult {
  if (!userRole) {
    return {
      allowed: false,
      error: "Não autenticado",
      reason: "user_role_missing",
    };
  }

  // ARQUITETO pode editar qualquer perfil
  if (userRole === Role.ARQUITETO) {
    return {
      allowed: true,
    };
  }

  // MODELO não pode editar seu próprio perfil (apenas ARQUITETO pode)
  if (userRole === Role.MODELO) {
    return {
      allowed: false,
      error: "Modelos não podem alterar seus dados após o cadastro. Apenas o Arquiteto responsável pode atualizar seus dados.",
      reason: "modelo_readonly",
    };
  }

  // Outros usuários podem editar apenas o próprio perfil
  if (targetUserId === currentUserId) {
    return {
      allowed: true,
    };
  }

  return {
    allowed: false,
    error: "Acesso negado. Você só pode editar seu próprio perfil.",
    reason: "profile_not_owned",
  };
}

