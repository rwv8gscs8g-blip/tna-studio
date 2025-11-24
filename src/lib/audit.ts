/**
 * Serviço de Auditoria Imutável
 * 
 * Registra todas as ações críticas do sistema de forma imutável.
 * Em produção: falha deve lançar exceção (fail-closed).
 * Em desenvolvimento: apenas logar erro.
 */

import { prisma } from "@/lib/prisma";

interface AuditContext {
  actorId?: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, any>;
}

/**
 * Sanitiza metadata removendo dados sensíveis
 */
function sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
  if (!metadata) return undefined;

  const sanitized = { ...metadata };
  
  // Remover campos sensíveis
  const sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'secret',
    'apiKey',
    'certificate',
    'privateKey',
    'cpf',
    'passport',
    'phone',
    'email',
  ];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Limitar tamanho do metadata (máximo 10KB quando serializado)
  const serialized = JSON.stringify(sanitized);
  if (serialized.length > 10000) {
    return {
      ...sanitized,
      _truncated: true,
      _originalSize: serialized.length,
    };
  }

  return sanitized;
}

/**
 * Registra uma ação de auditoria
 * 
 * @param context - Contexto da ação a ser registrada
 * @throws Error em produção se falhar ao registrar
 */
export async function logAction(context: AuditContext): Promise<void> {
  const { actorId, action, entity, entityId, metadata } = context;

  const sanitizedMetadata = sanitizeMetadata(metadata);

  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        actorId: actorId || null,
        metadata: sanitizedMetadata ? (sanitizedMetadata as any) : null,
      },
    });
  } catch (error: any) {
    const errorMessage = `Falha ao registrar auditoria: ${error.message}`;
    
    if (process.env.NODE_ENV === 'production') {
      // Em produção: fail-closed - lançar exceção (relançar o erro original)
      console.error(`[AUDIT] ${errorMessage}`, error);
      throw error; // Relançar o erro original, não criar um novo
    } else {
      // Em desenvolvimento: apenas logar
      console.warn(`[AUDIT] ${errorMessage}`, error);
    }
  }
}

/**
 * Helper para registrar ações de deleção lógica
 */
export async function logDeleteAction(
  actorId: string | undefined,
  entity: string,
  entityId: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAction({
    actorId,
    action: 'DELETE_LOGICAL',
    entity,
    entityId,
    metadata: {
      ...metadata,
      deletedAt: new Date().toISOString(),
    },
  });
}

/**
 * Helper para registrar acesso administrativo a recursos sensíveis
 */
export async function logAdminAccess(
  actorId: string,
  entity: string,
  entityId: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAction({
    actorId,
    action: 'ADMIN_ACCESS_SENSITIVE',
    entity,
    entityId,
    metadata,
  });
}

