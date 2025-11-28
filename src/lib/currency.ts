/**
 * Utilitário de Conversão de Moeda
 * 
 * Converte valores de EUR para BRL usando API pública.
 * Implementa cache para evitar requisições excessivas.
 */

const CACHE_KEY = "eur_brl_rate";
const CACHE_DURATION = 3600 * 1000; // 1 hora em milissegundos

interface ExchangeRate {
  rate: number;
  timestamp: number;
}

/**
 * Busca a cotação EUR-BRL da API AwesomeAPI
 * Cache: 1 hora
 */
export async function getEurToBrlRate(): Promise<number> {
  // Verificar cache em memória (apenas para esta execução)
  if (typeof global !== "undefined") {
    const cached = (global as any)[CACHE_KEY] as ExchangeRate | undefined;
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.rate;
    }
  }

  try {
    // API AwesomeAPI - gratuita e confiável
    const response = await fetch("https://economia.awesomeapi.com.br/last/EUR-BRL", {
      next: { revalidate: 3600 }, // Cache de 1 hora no Next.js
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    const rate = parseFloat(data.EURBRL?.bid || data.EURBRL?.high || "5.50");

    // Salvar no cache em memória
    if (typeof global !== "undefined") {
      (global as any)[CACHE_KEY] = {
        rate,
        timestamp: Date.now(),
      };
    }

    return rate;
  } catch (error) {
    console.warn("[currency] Erro ao buscar cotação, usando taxa padrão:", error);
    // Taxa padrão de fallback (aproximada)
    return 5.50;
  }
}

/**
 * Converte valor de EUR para BRL
 */
export async function convertEurToBrl(eur: number | null | undefined): Promise<number | null> {
  if (!eur || eur === 0) return null;
  
  const rate = await getEurToBrlRate();
  return eur * rate;
}

/**
 * Formata valor em BRL
 */
export function formatBrl(value: number | null | undefined): string {
  if (!value || value === 0) return "Cortesia";
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Formata valor em EUR
 */
export function formatEur(value: number | null | undefined): string {
  if (!value || value === 0) return "Cortesia";
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

