/**
 * Helpers centralizados de segurança e verificação de roles
 */

import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { errorResponse, forbiddenResponse } from "./api-response";

/**
 * Verifica se o usuário tem permissão de escrita (apenas ARQUITETO)
 */
export function requireArquiteto(userRole: Role | string | undefined): void {
  if (userRole !== Role.ARQUITETO && userRole !== "ARQUITETO") {
    throw new Error("Acesso negado. Apenas ARQUITETO pode realizar esta operação.");
  }
}

/**
 * Verifica se o usuário tem permissão de escrita e retorna resposta de erro se não tiver
 */
export function checkWritePermission(userRole: Role | string | undefined): NextResponse | null {
  if (userRole !== Role.ARQUITETO && userRole !== "ARQUITETO") {
    return forbiddenResponse("Acesso negado. Apenas ARQUITETO pode realizar esta operação.");
  }
  return null;
}

/**
 * Verifica se o usuário está autenticado
 */
export function requireAuth(session: any): void {
  if (!session?.user) {
    throw new Error("Não autenticado");
  }
}

/**
 * Verifica se o usuário tem um role específico
 */
export function requireRole(
  userRole: Role | string | undefined,
  allowedRoles: (Role | string)[]
): void {
  if (!userRole || !allowedRoles.includes(userRole)) {
    throw new Error("Acesso negado. Role não permitido.");
  }
}

/**
 * Verifica se ADMIN está tentando fazer escrita (bloqueia)
 */
export function blockAdminWrite(userRole: Role | string | undefined): boolean {
  return userRole === Role.ADMIN || userRole === "ADMIN";
}

/**
 * Helper para verificar permissões de escrita em rotas de API
 * Retorna null se permitido, ou NextResponse com erro se bloqueado
 */
export function validateWriteOperation(
  userRole: Role | string | undefined
): NextResponse | null {
  // ADMIN é estritamente somente leitura
  if (blockAdminWrite(userRole)) {
    return forbiddenResponse(
      "Acesso negado. ADMIN é somente leitura. Apenas ARQUITETO pode realizar operações de escrita."
    );
  }

  // Apenas ARQUITETO pode escrever
  if (userRole !== Role.ARQUITETO && userRole !== "ARQUITETO") {
    return forbiddenResponse("Acesso negado. Apenas ARQUITETO pode realizar esta operação.");
  }

  return null;
}

