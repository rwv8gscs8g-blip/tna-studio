/**
 * Guards de Escrita - Nova Arquitetura
 * 
 * Nesta nova arquitetura, apenas o perfil ARQUITETO pode realizar operações de escrita.
 * Todos os outros perfis (ADMIN, SUPER_ADMIN, MODEL, CLIENT) têm acesso somente leitura.
 * 
 * Para escrita, o ARQUITETO deve:
 * 1. Estar autenticado via certificado digital A1
 * 2. Ter sessão ativa válida (ArquitetoSession)
 * 3. A sessão deve estar no ambiente correto (production ou localhost)
 */

import { prisma } from "./prisma";
import { Role } from "@prisma/client";
import { canArquitetoWrite } from "./arquiteto-session";
import { validateAdminCertificateAndSign } from "./certificate-a1-production";

export interface WriteGuardResult {
  allowed: boolean;
  reason?: string;
  failedLayer?: number;
  details?: {
    roleValid?: boolean;
    sessionValid?: boolean;
    certificateValid?: boolean;
  };
}

/**
 * Verifica se operação de escrita pode ser executada
 * 
 * Apenas ARQUITETO pode escrever.
 * Todos os outros perfis são bloqueados.
 */
export async function canWriteOperation(
  userId: string,
  userRole: Role,
  operationType: string,
  operationId: string,
  payload: any,
  ip: string,
  userAgent: string,
  sessionId?: string // sessionId opcional para verificar sessão do Arquiteto
): Promise<WriteGuardResult> {
  const isDev = process.env.NODE_ENV === "development";

  // CAMADA 1: Verificar se o usuário é ARQUITETO
  if (userRole !== Role.ARQUITETO) {
    return {
      allowed: false,
      reason: `Apenas usuários com perfil ARQUITETO podem realizar operações de escrita`,
      failedLayer: 1,
      details: { roleValid: false },
    };
  }

  // CAMADA 2: Em desenvolvimento, sempre permite
  if (isDev) {
    return {
      allowed: true,
      details: {
        roleValid: true,
        sessionValid: true,
        certificateValid: true,
      },
    };
  }

  // CAMADA 3: Em produção, verificar sessão ativa do Arquiteto
  if (sessionId) {
    try {
      const sessionCheck = await canArquitetoWrite(userId, sessionId, userRole);
      if (!sessionCheck.allowed) {
        return {
          allowed: false,
          reason: sessionCheck.reason || "Sessão inválida do Arquiteto",
          failedLayer: 2,
          details: { roleValid: true, sessionValid: false },
        };
      }
    } catch (error: any) {
      return {
        allowed: false,
        reason: `Erro ao verificar sessão do Arquiteto: ${error.message}`,
        failedLayer: 2,
        details: { roleValid: true, sessionValid: false },
      };
    }
  }

  // CAMADA 4: Verificar certificado digital A1 (obrigatório para escrita em produção)
  try {
    const certCheck = await validateAdminCertificateAndSign(
      operationId,
      operationType,
      payload,
      userId,
      ip,
      userAgent
    );
    if (!certCheck.allowed) {
      return {
        allowed: false,
        reason: `Certificado A1 inválido: ${certCheck.reason}`,
        failedLayer: 3,
        details: {
          roleValid: true,
          sessionValid: true,
          certificateValid: false,
        },
      };
    }
  } catch (error: any) {
    return {
      allowed: false,
      reason: `Erro ao validar certificado A1: ${error.message}`,
      failedLayer: 3,
      details: {
        roleValid: true,
        sessionValid: true,
        certificateValid: false,
      },
    };
  }

  // Todas as camadas passaram
  return {
    allowed: true,
    details: {
      roleValid: true,
      sessionValid: true,
      certificateValid: true,
    },
  };
}

/**
 * Verifica se operação de leitura pode ser executada
 * 
 * Regras:
 * - ARQUITETO: pode ler tudo
 * - ADMIN: pode ler tudo (somente leitura)
 * - SUPER_ADMIN: pode ler tudo (somente leitura - apenas para gerenciar certificado)
 * - MODEL/CLIENT: pode ler apenas seus próprios dados
 */
export async function canReadOperation(
  userId: string,
  userRole: Role,
  resourceUserId?: string // ID do dono do recurso (para MODEL/CLIENT verificarem se é deles)
): Promise<{ allowed: boolean; reason?: string }> {
  // ARQUITETO, ADMIN e SUPER_ADMIN podem ler tudo
  if (userRole === Role.ARQUITETO || userRole === Role.ADMIN || userRole === Role.SUPERADMIN) {
    return { allowed: true };
  }

  // MODEL e CLIENT podem ler apenas seus próprios dados
  if (userRole === Role.MODELO || userRole === Role.CLIENTE) {
    if (!resourceUserId || resourceUserId !== userId) {
      return {
        allowed: false,
        reason: "Você só pode acessar seus próprios dados",
      };
    }
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Perfil não autorizado para leitura: ${userRole}`,
  };
}

/**
 * Registra operação administrativa assinada (auditoria)
 */
export async function logWriteOperation(
  userId: string,
  operationType: string,
  resourceType: string | null,
  resourceId: string | null,
  certificateSerial: string,
  signatureHash: string,
  signatureData: string,
  ip: string,
  userAgent: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  try {
    await prisma.adminOperation.create({
      data: {
        userId,
        operationType,
        resourceType,
        resourceId,
        certificateSerial,
        signatureHash,
        signatureData,
        ip,
        userAgent,
        success,
        errorMessage,
      },
    });
  } catch (error: any) {
    // Não falha a operação principal se o log falhar
    console.error("[WriteGuard] Erro ao registrar operação:", error);
  }
}

