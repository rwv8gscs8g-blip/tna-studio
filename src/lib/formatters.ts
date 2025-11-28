/**
 * Helpers de formatação de dados
 * CPF, CEP, telefone, etc.
 */

/**
 * Formata CPF: 000.000.000-00
 */
export function formatCpf(cpf: string | null | undefined): string {
  if (!cpf) return "";
  // Remove tudo que não é número
  const numbers = cpf.replace(/\D/g, "");
  // Aplica máscara
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

/**
 * Remove formatação do CPF, retornando apenas números
 */
export function parseCpf(cpf: string | null | undefined): string {
  if (!cpf) return "";
  return cpf.replace(/\D/g, "");
}

/**
 * Valida CPF (formato e dígitos verificadores)
 */
export function validateCpf(cpf: string | null | undefined): boolean {
  const numbers = parseCpf(cpf);
  if (numbers.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numbers)) return false; // Todos os dígitos iguais

  // Validar dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 >= 10) digit1 = 0;
  if (digit1 !== parseInt(numbers[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 >= 10) digit2 = 0;
  if (digit2 !== parseInt(numbers[10])) return false;

  return true;
}

/**
 * Formata CEP: 00000-000
 */
export function formatCep(cep: string | null | undefined): string {
  if (!cep) return "";
  // Remove tudo que não é número
  const numbers = cep.replace(/\D/g, "");
  // Aplica máscara
  if (numbers.length <= 5) return numbers;
  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
}

/**
 * Remove formatação do CEP, retornando apenas números
 */
export function parseCep(cep: string | null | undefined): string {
  if (!cep) return "";
  return cep.replace(/\D/g, "");
}

/**
 * Valida CEP (formato: 8 dígitos)
 */
export function validateCep(cep: string | null | undefined): boolean {
  const numbers = parseCep(cep);
  return numbers.length === 8 && /^\d{8}$/.test(numbers);
}

