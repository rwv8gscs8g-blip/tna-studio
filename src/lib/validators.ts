/**
 * Validadores para TNA Studio
 * Validações de CPF, telefone E.164, passaporte ICAO, email RFC 5322, data de nascimento
 */

/**
 * Valida CPF brasileiro (11 dígitos, com cálculo dos dígitos verificadores)
 * @param cpf - CPF a ser validado (com ou sem formatação)
 * @returns true se válido, false caso contrário
 */
export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, "");

  // Deve ter 11 dígitos
  if (cleanCPF.length !== 11) return false;

  // Não pode ser sequência de números iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Calcula primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

  // Calcula segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

/**
 * Valida telefone no formato E.164 (ex: +5511987654321)
 * @param phone - Telefone a ser validado
 * @returns true se válido, false caso contrário
 */
export function validatePhoneE164(phone: string): boolean {
  // Formato E.164: +[código do país][número]
  // Mínimo: +1 + 7 dígitos = 8 caracteres
  // Máximo: +999 + 15 dígitos = 18 caracteres
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone.trim());
}

/**
 * Normaliza telefone para formato E.164
 * @param phone - Telefone a normalizar
 * @returns Telefone no formato E.164 ou null se inválido
 */
export function normalizePhoneE164(phone: string): string | null {
  const clean = phone.replace(/\D/g, "");
  if (clean.length < 8 || clean.length > 15) return null;

  // Se já começa com +, valida e retorna
  if (phone.trim().startsWith("+")) {
    return validatePhoneE164(phone) ? phone.trim() : null;
  }

  // Assume Brasil (+55) se não tiver código do país
  if (clean.length >= 10 && clean.length <= 11) {
    // Remove 0 inicial se houver (DDD brasileiro)
    const ddd = clean.length === 11 ? clean.substring(0, 2) : clean.substring(0, 2);
    const number = clean.substring(2);
    return `+55${ddd}${number}`;
  }

  return null;
}

/**
 * Valida passaporte no padrão ICAO (International Civil Aviation Organization)
 * Formato: 2 letras (código do país) + 6-9 caracteres alfanuméricos
 * @param passport - Passaporte a ser validado
 * @returns true se válido, false caso contrário
 */
export function validatePassportICAO(passport: string): boolean {
  // Remove espaços e converte para maiúsculas
  const clean = passport.trim().toUpperCase();

  // Formato ICAO: 2 letras (código do país) + 6-9 caracteres alfanuméricos
  // Exemplos válidos: BR123456, US123456789, GB1234567
  const icaoRegex = /^[A-Z]{2}[A-Z0-9]{6,9}$/;
  return icaoRegex.test(clean);
}

/**
 * Valida email conforme RFC 5322 (simplificado, mas robusto)
 * @param email - Email a ser validado
 * @returns true se válido, false caso contrário
 */
export function validateEmailRFC5322(email: string): boolean {
  // Regex simplificado mas robusto para RFC 5322
  // Aceita a maioria dos casos válidos sem ser muito permissivo
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email.trim().toLowerCase());
}

/**
 * Valida data de nascimento e verifica se pessoa tem ≥ 18 anos
 * @param birthDate - Data de nascimento (string DD/MM/AAAA ou Date)
 * @returns { valid: boolean, age?: number, error?: string }
 */
export function validateBirthDate18Plus(
  birthDate: string | Date
): { valid: boolean; age?: number; error?: string } {
  let date: Date;

  if (typeof birthDate === "string") {
    // Tenta parsear formato DD/MM/AAAA
    const parts = birthDate.trim().split("/");
    if (parts.length !== 3) {
      return { valid: false, error: "Formato inválido. Use DD/MM/AAAA" };
    }

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Mês é 0-indexed
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return { valid: false, error: "Data inválida" };
    }

    date = new Date(year, month, day);
  } else {
    date = birthDate;
  }

  // Verifica se data é válida
  if (isNaN(date.getTime())) {
    return { valid: false, error: "Data inválida" };
  }

  // Verifica se não é data futura
  const now = new Date();
  if (date > now) {
    return { valid: false, error: "Data de nascimento não pode ser futura" };
  }

  // Calcula idade
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age--;
  }

  if (age < 18) {
    return { valid: false, age, error: "É necessário ter 18 anos ou mais" };
  }

  return { valid: true, age };
}

/**
 * Valida senha forte
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Pelo menos 1 maiúscula
 * - Pelo menos 1 minúscula
 * - Pelo menos 1 número
 * - Pelo menos 1 símbolo
 * @param password - Senha a ser validada
 * @returns { valid: boolean, errors: string[] }
 */
export function validateStrongPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Senha deve ter no mínimo 8 caracteres");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Senha deve conter pelo menos 1 letra maiúscula");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Senha deve conter pelo menos 1 letra minúscula");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Senha deve conter pelo menos 1 número");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Senha deve conter pelo menos 1 símbolo");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Formata CPF (12345678901 -> 123.456.789-01)
 */
export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Formata telefone E.164 para exibição (+5511987654321 -> (11) 98765-4321)
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone.startsWith("+")) return phone;
  
  // Remove o +
  const clean = phone.substring(1);
  
  // Se for Brasil (+55)
  if (clean.startsWith("55") && clean.length === 13) {
    const ddd = clean.substring(2, 4);
    const number = clean.substring(4);
    if (number.length === 9) {
      // Celular: (11) 98765-4321
      return `(${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
    } else if (number.length === 8) {
      // Fixo: (11) 3456-7890
      return `(${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
    }
  }
  
  // Outros países: retorna como está
  return phone;
}

