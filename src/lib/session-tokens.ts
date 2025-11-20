/**
 * Sistema de tokens de sessão efêmeros
 * 
 * Gera tokens únicos por sessão para URLs efêmeras que expiram
 */

import { randomBytes } from "crypto";

// Armazena tokens ativos (em produção, usar Redis ou similar)
interface TokenData {
  userId: string;
  createdAt: number;
  expiresAt: number;
  used: boolean; // Previne reutilização
}

const activeTokens = new Map<string, TokenData>();

// Limpa tokens expirados periodicamente
setInterval(() => {
  const now = Date.now();
  let expiredCount = 0;
  for (const [token, data] of activeTokens.entries()) {
    if (data.expiresAt < now) {
      activeTokens.delete(token);
      expiredCount++;
    }
  }
  if (expiredCount > 0) {
    console.log(`[SessionTokens] Limpeza automática: ${expiredCount} token(s) expirado(s) removido(s)`);
  }
}, 30000); // Limpa a cada 30 segundos

/**
 * Gera um token único para a sessão
 * Garante unicidade verificando se o token já existe (extremamente raro, mas seguro)
 */
export function generateSessionToken(userId: string): string {
  let token: string;
  let attempts = 0;
  const maxAttempts = 10;

  // Garante unicidade (extremamente improvável colisão, mas adiciona segurança)
  do {
    token = randomBytes(32).toString("hex");
    attempts++;
    if (attempts >= maxAttempts) {
      throw new Error("Falha ao gerar token único após múltiplas tentativas");
    }
  } while (activeTokens.has(token));

  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutos

  activeTokens.set(token, {
    userId,
    createdAt: now,
    expiresAt,
    used: false,
  });

  console.log(`[SessionTokens] Token gerado para userId: ${userId.substring(0, 8)}... (expira em ${new Date(expiresAt).toISOString()})`);

  return token;
}

/**
 * Valida um token de sessão
 * Rejeita imediatamente tokens expirados e adiciona logs
 */
export function validateSessionToken(token: string, userId: string): boolean {
  const now = Date.now();
  const tokenData = activeTokens.get(token);

  if (!tokenData) {
    console.warn(`[SessionTokens] Token não encontrado: ${token.substring(0, 16)}...`);
    return false;
  }

  // Valida expiração PRIMEIRO (mais crítico)
  if (tokenData.expiresAt < now) {
    activeTokens.delete(token);
    const expiredSeconds = Math.floor((now - tokenData.expiresAt) / 1000);
    console.warn(`[SessionTokens] Token EXPIRADO rejeitado: ${token.substring(0, 16)}... (expirado há ${expiredSeconds}s)`);
    return false;
  }

  // Valida userId
  if (tokenData.userId !== userId) {
    console.warn(`[SessionTokens] Token rejeitado - userId não corresponde: ${token.substring(0, 16)}... (esperado: ${userId.substring(0, 8)}..., recebido: ${tokenData.userId.substring(0, 8)}...)`);
    return false;
  }

  // Marca como usado (opcional - pode ser usado uma vez ou múltiplas vezes dependendo da necessidade)
  // Por enquanto, permitimos múltiplos usos até expirar

  const remainingSeconds = Math.floor((tokenData.expiresAt - now) / 1000);
  console.log(`[SessionTokens] Token VÁLIDO: ${token.substring(0, 16)}... (${remainingSeconds}s restantes)`);

  return true;
}

/**
 * Revoga um token (útil para logout)
 */
export function revokeSessionToken(token: string): void {
  activeTokens.delete(token);
}

/**
 * Revoga todos os tokens de um usuário
 */
export function revokeAllUserTokens(userId: string): void {
  for (const [token, data] of activeTokens.entries()) {
    if (data.userId === userId) {
      activeTokens.delete(token);
    }
  }
}


