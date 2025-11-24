/**
 * Guard de Proteção de Ambiente
 * 
 * Previne execução de operações destrutivas ou perigosas em produção.
 * Confia exclusivamente em NODE_ENV para determinar o ambiente.
 */

/**
 * Garante que a ação não seja executada em produção
 * 
 * @param action - Nome da ação que está sendo bloqueada (para logging)
 * @throws Process.exit(1) se executado em produção
 */
export function ensureNotProduction(action: string): void {
  if (process.env.NODE_ENV === "production") {
    console.error(`❌ ERRO CRÍTICO: Ação '${action}' bloqueada em ambiente de PRODUÇÃO.`);
    console.error(`   Esta operação é permitida apenas em desenvolvimento.`);
    console.error(`   NODE_ENV atual: ${process.env.NODE_ENV}`);
    process.exit(1);
  }
}

/**
 * Verifica se está em produção
 * 
 * @returns true se NODE_ENV === "production"
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Verifica se está em desenvolvimento
 * 
 * @returns true se NODE_ENV !== "production"
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV !== "production";
}

