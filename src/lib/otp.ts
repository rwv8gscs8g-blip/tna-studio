/**
 * Biblioteca de OTP (One-Time Password)
 * Geração e validação de códigos OTP de 6 dígitos
 */

/**
 * Gera um código OTP de 6 dígitos
 * @returns Código OTP de 6 dígitos (string)
 */
export function generateOTP(): string {
  // Gera número aleatório entre 100000 e 999999
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

/**
 * Valida formato de OTP (6 dígitos)
 * @param otp - Código OTP a validar
 * @returns true se válido, false caso contrário
 */
export function validateOTPFormat(otp: string): boolean {
  // Deve ser exatamente 6 dígitos
  return /^\d{6}$/.test(otp.trim());
}

/**
 * Calcula data de expiração (TTL de 5 minutos)
 * @returns Data de expiração (DateTime)
 */
export function getOTPExpiration(): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5); // TTL de 5 minutos
  return now;
}

/**
 * Verifica se OTP está expirado
 * @param expiresAt - Data de expiração
 * @returns true se expirado, false caso contrário
 */
export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Limpa OTPs expirados (helper para limpeza periódica)
 * @param otpTokens - Array de tokens OTP
 * @returns Array de tokens não expirados
 */
export function filterExpiredOTPs<T extends { expiresAt: Date }>(
  otpTokens: T[]
): T[] {
  const now = new Date();
  return otpTokens.filter((token) => token.expiresAt > now);
}

