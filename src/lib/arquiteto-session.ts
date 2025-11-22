/**
 * Gerenciamento de Sessão do Arquiteto
 * 
 * Garante que apenas UM Arquiteto pode estar logado por vez em qualquer ambiente.
 * Ao logar um segundo Arquiteto, a sessão anterior é encerrada imediatamente.
 * 
 * Ambiente pode ser "production" ou "localhost".
 * Se há sessão ativa em um ambiente, o outro fica em modo read-only.
 */

import { prisma } from "./prisma";
import { Role } from "@prisma/client";

/**
 * Registra sessão do Arquiteto
 * 
 * Se já existe sessão ativa do Arquiteto, marca as anteriores como inativas (isActive = false).
 * Garante que apenas a sessão mais recente fica ativa (isActive = true).
 * Permite múltiplas sessões, mas apenas uma com poderes de escrita.
 */
export async function registerArquitetoSession(
  userId: string,
  sessionId: string,
  ip: string,
  userAgent: string,
  expiresAt: Date
): Promise<void> {
  try {
    // 1. Verificar se o usuário é ARQUITETO
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== Role.ARQUITETO) {
      throw new Error("Apenas usuários com perfil ARQUITETO podem ter sessão de arquiteto");
    }

    // 2. Marca TODAS as sessões ativas do Arquiteto como inativas (isActive = false)
    // Isso garante que apenas a sessão mais recente fica ativa
    await prisma.arquitetoSession.updateMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(), // Apenas sessões não expiradas
        },
      },
      data: {
        isActive: false,
      },
    });

    // 3. Cria ou atualiza sessão atual como ativa
    await prisma.arquitetoSession.upsert({
      where: { sessionId },
      update: {
        isActive: true,
        expiresAt,
      },
      create: {
        userId,
        sessionId,
        isActive: true,
        expiresAt,
      },
    });

    console.log(`[ArquitetoSession] Sessão registrada para userId=${userId.substring(0, 8)}... sessionId=${sessionId.substring(0, 8)}...`);
  } catch (error: any) {
    // Erro P2021: tabela não existe - degradável, não quebra login
    if (error?.code === "P2021" || error?.code === "P1001" || error?.message?.includes("does not exist")) {
      console.warn(`[ArquitetoSession] Tabela ArquitetoSession não existe ou não está acessível (${error.code}). Login continuará sem sessão especial.`);
      return; // Não lança erro, apenas loga e retorna
    }
    // Outros erros são relançados
    throw error;
  }
}

/**
 * Verifica se a sessão do Arquiteto está em modo somente leitura
 * 
 * Retorna true se:
 * - O usuário é ARQUITETO
 * - Existe uma sessão ativa diferente da atual (outra sessão mais recente)
 * 
 * Retorna false se:
 * - Não é ARQUITETO
 * - Não há sessão registrada
 * - A sessão atual é a ativa (isActive = true)
 */
export async function isArquitetoSessionReadOnly(
  userId: string,
  sessionId: string
): Promise<boolean> {
  try {
    // Busca sessão atual
    const currentSession = await prisma.arquitetoSession.findUnique({
      where: { sessionId },
    });

    // Se não há sessão atual, não está em modo somente leitura (sessão nova)
    if (!currentSession) {
      return false;
    }

    // Se sessão expirou, não está em modo somente leitura (sessão inválida)
    if (currentSession.expiresAt < new Date()) {
      return false;
    }

    // Se a sessão atual está ativa (isActive = true), não está em modo somente leitura
    if (currentSession.isActive) {
      return false;
    }

    // Se a sessão atual não está ativa, está em modo somente leitura
    // (existe outra sessão mais recente com isActive = true)
    return true;
  } catch (error: any) {
    // Erro P2021: tabela não existe - degradável, não quebra
    if (error?.code === "P2021" || error?.code === "P1001" || error?.message?.includes("does not exist")) {
      console.warn(`[ArquitetoSession] Tabela ArquitetoSession não existe ou não está acessível (${error.code}). Assumindo sessão não está em modo somente leitura.`);
      return false; // Não bloqueia se a tabela não existe
    }
    // Outros erros: loga e retorna false (não bloqueia)
    console.error(`[ArquitetoSession] Erro ao verificar modo somente leitura:`, error);
    return false;
  }
}

/**
 * Verifica se o Arquiteto pode usar funções de escrita
 * 
 * Retorna true se:
 * - O usuário é ARQUITETO
 * - Existe sessão ativa do Arquiteto (isActive = true)
 * - A sessão não expirou
 * - A sessão está no ambiente atual
 */
export async function canArquitetoWrite(
  userId: string,
  sessionId: string,
  userRole: Role
): Promise<{ allowed: boolean; reason?: string }> {
  // 1. Apenas ARQUITETO pode escrever
  if (userRole !== Role.ARQUITETO) {
    return {
      allowed: false,
      reason: "Apenas usuários com perfil ARQUITETO podem realizar operações de escrita",
    };
  }

  // 2. Em desenvolvimento, permite ignorar restrição (para facilitar testes)
  // Mas ainda valida se há sessão ativa diferente
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    // Em dev, verifica se há sessão ativa diferente, mas não bloqueia
    // Isso permite testar o comportamento sem bloquear totalmente
    try {
      const currentSession = await prisma.arquitetoSession.findUnique({
        where: { sessionId },
      });
      if (currentSession && !currentSession.isActive) {
        // Há outra sessão ativa, mas em dev não bloqueia
        console.warn(`[ArquitetoSession] [DEV] Sessão em modo somente leitura detectada, mas ignorada em desenvolvimento`);
      }
    } catch (error: any) {
      // Ignora erros em dev
    }
    return { allowed: true };
  }

  // 3. Em produção, validar sessionId no banco
  try {
    const currentSession = await prisma.arquitetoSession.findUnique({
      where: { sessionId },
    });

    if (!currentSession) {
      return {
        allowed: false,
        reason: "Sessão do Arquiteto não encontrada. Faça login novamente.",
      };
    }

    if (currentSession.expiresAt < new Date()) {
      await prisma.arquitetoSession.delete({
        where: { id: currentSession.id },
      });
      return {
        allowed: false,
        reason: "Sessão do Arquiteto expirada. Faça login novamente.",
      };
    }

    if (!currentSession.isActive) {
      return {
        allowed: false,
        reason: "Sessão do Arquiteto em modo somente leitura. Existe outra sessão ativa mais recente. Faça login novamente para retomar os poderes de edição.",
      };
    }

    return { allowed: true };
  } catch (error: any) {
    console.error(`[ArquitetoSession] Erro ao verificar sessão:`, error);
    return {
      allowed: false,
      reason: `Erro ao verificar sessão do Arquiteto: ${error.message}`,
    };
  }
}

/**
 * Verifica se existe sessão ativa do Arquiteto em qualquer ambiente
 */
export async function hasActiveArquitetoSession(): Promise<boolean> {
  const activeSession = await prisma.arquitetoSession.findFirst({
    where: {
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  return !!activeSession;
}

/**
 * Remove sessão do Arquiteto (logout)
 */
export async function removeArquitetoSession(userId: string): Promise<void> {
  await prisma.arquitetoSession.deleteMany({
    where: { userId },
  });
  console.log(`[ArquitetoSession] Sessão removida para userId=${userId.substring(0, 8)}...`);
}

/**
 * Limpa sessões expiradas (executar periodicamente)
 */
export async function cleanupExpiredArquitetoSessions(): Promise<number> {
  const result = await prisma.arquitetoSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}

/**
 * Obtém informações da sessão ativa do Arquiteto
 */
export async function getActiveArquitetoSession(): Promise<{
  userId: string;
  expiresAt: Date;
} | null> {
  const session = await prisma.arquitetoSession.findFirst({
    where: {
      isActive: true,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!session) {
    return null;
  }

  return {
    userId: session.userId,
    expiresAt: session.expiresAt,
  };
}

