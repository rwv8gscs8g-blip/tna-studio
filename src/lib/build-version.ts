/**
 * Sistema de versão de build para invalidar tokens antigos
 * 
 * Gera um timestamp único a cada build/restart do servidor
 * Tokens gerados antes deste timestamp são automaticamente inválidos
 * 
 * Usa singleton global para garantir que o timestamp seja o mesmo em todas as requisições
 */

declare global {
  // eslint-disable-next-line no-var
  var __BUILD_TIMESTAMP: number | undefined;
  // eslint-disable-next-line no-var
  var __BUILD_VERSION: string | undefined;
}

// Singleton global - só inicializa uma vez por processo
function getBuildTimestamp(): number {
  if (typeof global.__BUILD_TIMESTAMP === "undefined") {
    global.__BUILD_TIMESTAMP = Date.now();
    global.__BUILD_VERSION = process.env.BUILD_VERSION || `build-${global.__BUILD_TIMESTAMP}`;
    console.log(`[BuildVersion] Build iniciado em ${new Date(global.__BUILD_TIMESTAMP).toISOString()} (versão: ${global.__BUILD_VERSION})`);
  }
  return global.__BUILD_TIMESTAMP;
}

function getBuildVersion(): string {
  if (typeof global.__BUILD_VERSION === "undefined") {
    getBuildTimestamp(); // Inicializa se necessário
  }
  return global.__BUILD_VERSION!;
}

export const BUILD_TIMESTAMP = getBuildTimestamp();
export const BUILD_VERSION = getBuildVersion();

/**
 * Verifica se um token foi criado antes do build atual
 */
export function isTokenFromOldBuild(tokenIat: number | undefined): boolean {
  if (!tokenIat) {
    return true; // Token sem iat é considerado antigo
  }
  
  // Converte iat (segundos) para milissegundos
  const tokenTimestamp = tokenIat * 1000;
  
  // Se o token foi criado antes do build atual, é inválido
  return tokenTimestamp < BUILD_TIMESTAMP;
}

