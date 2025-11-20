/**
 * Geração segura de nomes de arquivo baseados em CPF
 * 
 * Estrutura: cpf-{CPF}/session-{ID}/photo-{SEQ}.{ext}
 * Exemplo: cpf-12345678901/session-001/photo-001.jpg
 */

export interface ImageNamingOptions {
  cpf: string; // CPF do modelo (apenas números)
  sessionId: string; // ID da sessão (ex: "001", "2025-11-19")
  sequence: number; // Sequência da foto na sessão
  extension: string; // Extensão do arquivo (ex: "jpg", "png")
}

/**
 * Gera key segura para armazenamento
 */
export function generateImageKey(options: ImageNamingOptions): string {
  const { cpf, sessionId, sequence, extension } = options;
  
  // Normaliza CPF (remove formatação)
  const normalizedCpf = cpf.replace(/\D/g, "");
  
  if (normalizedCpf.length !== 11) {
    throw new Error("CPF deve conter 11 dígitos");
  }
  
  // Formata sequência com zero à esquerda
  const seqStr = sequence.toString().padStart(3, "0");
  
  return `cpf-${normalizedCpf}/session-${sessionId}/photo-${seqStr}.${extension}`;
}

/**
 * Extrai informações de uma key existente
 */
export function parseImageKey(key: string): ImageNamingOptions | null {
  const match = key.match(/^cpf-(\d{11})\/session-([^/]+)\/photo-(\d+)\.(\w+)$/);
  
  if (!match) {
    return null;
  }
  
  const [, cpf, sessionId, sequence, extension] = match;
  
  return {
    cpf,
    sessionId,
    sequence: parseInt(sequence, 10),
    extension,
  };
}

/**
 * Valida se uma key segue o padrão esperado
 */
export function isValidImageKey(key: string): boolean {
  return parseImageKey(key) !== null;
}

