/**
 * Gerenciamento de Sessões de Admin
 * Previne que admin use funções administrativas simultaneamente em localhost e produção
 * Valida versões de código e migrations antes de permitir escrita
 */

import { prisma } from "./prisma";
import { Role } from "@prisma/client";
import { validateVersions, getCurrentCodeVersion, getCurrentMigrationVersion, getCurrentSchemaVersion } from "./version-guard";

const ENVIRONMENT = process.env.NODE_ENV === "production" ? "production" : "localhost";

/**
 * Verifica se admin pode usar funções administrativas
 * 
 * NOTA: AdminSession foi substituída por ArquitetoSession na nova arquitetura.
 * Esta função é mantida apenas para compatibilidade com write-guard.ts antigo.
 * Na nova arquitetura, apenas ARQUITETO pode escrever (via write-guard-arquiteto.ts).
 * 
 * Esta função sempre retorna { allowed: true } para não quebrar código legado.
 */
export async function canAdminUseFunctions(
  userId: string,
  userRole: Role
): Promise<{ allowed: boolean; reason?: string }> {
  // NOTA: Na nova arquitetura, apenas ARQUITETO pode escrever
  // Esta função sempre permite para não quebrar código legado
  // O controle real de escrita está em write-guard-arquiteto.ts
  
  // Sempre permite (compatibilidade com código antigo)
  return { allowed: true };
}

/**
 * Registra sessão ativa de admin
 * 
 * NOTA: AdminSession foi substituída por ArquitetoSession na nova arquitetura.
 * Esta função é mantida apenas para compatibilidade e não faz nada.
 */
export async function registerAdminSession(
  userId: string,
  ip: string,
  userAgent: string,
  expiresAt: Date,
  preStartValidated: boolean = false
): Promise<void> {
  // NOTA: AdminSession foi substituída por ArquitetoSession
  // Esta função não faz nada (compatibilidade)
  // Na nova arquitetura, use registerArquitetoSession() de arquiteto-session.ts
  console.warn(`[AdminSession] registerAdminSession() chamado mas não faz nada (compatibilidade). Use registerArquitetoSession() na nova arquitetura.`);
}

/**
 * Remove sessão de admin (logout)
 * 
 * NOTA: AdminSession foi substituída por ArquitetoSession na nova arquitetura.
 * Esta função é mantida apenas para compatibilidade e não faz nada.
 */
export async function removeAdminSession(userId: string): Promise<void> {
  // NOTA: AdminSession foi substituída por ArquitetoSession
  // Esta função não faz nada (compatibilidade)
  // Na nova arquitetura, use removeArquitetoSession() de arquiteto-session.ts
  // Não loga para evitar poluir logs em produção
}

/**
 * Limpa sessões expiradas (executar periodicamente)
 * 
 * NOTA: AdminSession foi substituída por ArquitetoSession na nova arquitetura.
 * Esta função é mantida apenas para compatibilidade e sempre retorna 0.
 */
export async function cleanupExpiredAdminSessions(): Promise<number> {
  // NOTA: AdminSession foi substituída por ArquitetoSession
  // Esta função sempre retorna 0 (compatibilidade)
  // Na nova arquitetura, use cleanupExpiredArquitetoSessions() de arquiteto-session.ts
  return 0;
}

