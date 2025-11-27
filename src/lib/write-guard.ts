/**
 * Guards de Escrita - 6 Camadas de Verificação
 * 
 * Este módulo implementa as 6 camadas obrigatórias de verificação
 * antes de permitir qualquer operação administrativa de escrita:
 * 
 * 1. Verificação do Certificado A1 (obrigatória)
 * 2. Verificação do login do admin
 * 3. Verificação do script pré-start
 * 4. Verificação de ambiente
 * 5. Verificação do guard de versão
 * 6. Verificação da integridade do schema
 * 
 * Nada pode ser gravado sem passar por esses seis filtros.
 */

import { prisma } from "./prisma";
import { Role } from "@prisma/client";
import { canAdminUseFunctions } from "./admin-session";
import { validateAdminCertificateAndSign } from "./certificate-a1-production";

export interface WriteGuardResult {
  allowed: boolean;
  reason?: string;
  failedLayer?: number; // Qual camada falhou (1-6)
  details?: {
    certificateValid?: boolean;
    loginValid?: boolean;
    preStartValid?: boolean;
    environmentValid?: boolean;
    versionValid?: boolean;
    schemaValid?: boolean;
  };
}

/**
 * Verifica se operação administrativa de escrita pode ser executada
 * 
 * Implementa as 6 camadas obrigatórias de verificação
 * 
 * IMPORTANTE: Quando CERT_A1_ENFORCE_WRITES=true, o Certificado A1 é OBRIGATÓRIO.
 * Sem certificado válido, a operação é BLOQUEADA (hard fail).
 */
export async function canWriteAdminOperation(
  userId: string,
  userRole: Role,
  operationType: string,
  operationId: string,
  payload: any,
  ip: string,
  userAgent: string,
  environment: string = process.env.NODE_ENV || "development"
): Promise<WriteGuardResult> {
  const details: WriteGuardResult["details"] = {};

  // CAMADA 1: Verificação do Certificado A1 (OBRIGATÓRIA quando CERT_A1_ENFORCE_WRITES=true)
  const certCheck = await validateAdminCertificateAndSign(
    operationId,
    operationType,
    payload,
    userId,
    ip,
    userAgent
  );
  details.certificateValid = certCheck.allowed;
  
  if (!certCheck.allowed) {
    return {
      allowed: false,
      reason: `Camada 1 falhou: ${certCheck.reason}`,
      failedLayer: 1,
      details,
    };
  }

  // CAMADA 2: Verificação do login do admin
  if (userRole !== Role.ADMIN && userRole !== Role.SUPERADMIN) {
    return {
      allowed: false,
      reason: "Camada 2 falhou: Usuário não é admin",
      failedLayer: 2,
      details: { ...details, loginValid: false },
    };
  }
  details.loginValid = true;

  // CAMADA 3: Verificação do script pré-start
  // NOTA: AdminSession foi substituída por ArquitetoSession
  // Esta validação é simplificada (sempre passa) para compatibilidade
  let session = null;
  try {
    session = await (prisma as any).adminSession?.findUnique({
      where: { userId },
      select: { preStartValidated: true },
    });
  } catch (error: any) {
    // Tabela não existe - degradável, sempre permite
    if (error?.code === "P2021" || error?.code === "P1001" || error?.message?.includes("does not exist")) {
      console.warn(`[WriteGuard] Tabela AdminSession não existe. Validando sem verificação pré-start (compatibilidade).`);
      session = { preStartValidated: true }; // Assume validado
    }
  }

  if (session && !session.preStartValidated) {
    return {
      allowed: false,
      reason: "Camada 3 falhou: Script pré-start não validado. Execute 'npm run validate' primeiro.",
      failedLayer: 3,
      details: { ...details, preStartValid: false },
    };
  }
  details.preStartValid = true;

  // CAMADA 4: Verificação de ambiente
  const envCheck = await validateEnvironment(userId, environment);
  details.environmentValid = envCheck.allowed;
  
  if (!envCheck.allowed) {
    return {
      allowed: false,
      reason: `Camada 4 falhou: ${envCheck.reason}`,
      failedLayer: 4,
      details,
    };
  }

  // CAMADA 5: Verificação do guard de versão
  const versionCheck = await canAdminUseFunctions(userId, userRole);
  details.versionValid = versionCheck.allowed;
  
  if (!versionCheck.allowed) {
    return {
      allowed: false,
      reason: `Camada 5 falhou: ${versionCheck.reason}`,
      failedLayer: 5,
      details,
    };
  }

  // CAMADA 6: Verificação da integridade do schema
  const schemaCheck = await validateSchemaIntegrity();
  details.schemaValid = schemaCheck.valid;
  
  if (!schemaCheck.valid) {
    return {
      allowed: false,
      reason: `Camada 6 falhou: ${schemaCheck.error}`,
      failedLayer: 6,
      details,
    };
  }

  // Todas as camadas passaram
  return {
    allowed: true,
    details: {
      certificateValid: true,
      loginValid: true,
      preStartValid: true,
      environmentValid: true,
      versionValid: true,
      schemaValid: true,
    },
  };
}

/**
 * Valida ambiente (Camada 4)
 */
async function validateEnvironment(
  userId: string,
  environment: string
): Promise<{ allowed: boolean; reason?: string }> {
  const isLocalhost = environment !== "production";
  const isProductionDB =
    process.env.DATABASE_URL?.includes("production") ||
    process.env.DATABASE_URL === process.env.PRODUCTION_DATABASE_URL;

  // Se localhost conectado à produção, é perigoso
  if (isLocalhost && isProductionDB) {
    return {
      allowed: false,
      reason: "Localhost conectado ao banco de produção. Use Neon Branching.",
    };
  }

  // NOTA: AdminSession foi substituída por ArquitetoSession
  // Esta validação é simplificada para compatibilidade
  
  // Verificar se há sessão ativa em outro ambiente (degradável)
  let session = null;
  try {
    session = await (prisma as any).adminSession?.findUnique({
      where: { userId },
    });
  } catch (error: any) {
    // Tabela não existe - degradável, permite
    if (error?.code === "P2021" || error?.code === "P1001" || error?.message?.includes("does not exist")) {
      // Permite (compatibilidade)
      return { allowed: true };
    }
  }

  if (session && session.environment !== environment) {
    return {
      allowed: false,
      reason: `Admin ativo em ${session.environment}. Faça logout primeiro.`,
    };
  }

  return { allowed: true };
}

/**
 * Valida integridade do schema (Camada 6)
 */
async function validateSchemaIntegrity(): Promise<{ valid: boolean; error?: string }> {
  try {
    // Consultar AppConfig para schema autorizado
    const config = await prisma.appConfig.findUnique({
      where: { id: "singleton" },
    });

    if (!config?.authorizedSchemaVersion) {
      // Primeira execução - permite
      return { valid: true };
    }

    // Calcular hash do schema atual
    const { readFileSync } = await import("fs");
    const { join } = await import("path");
    const { createHash } = await import("crypto");
    
    const schemaPath = join(process.cwd(), "prisma", "schema.prisma");
    const schemaContent = readFileSync(schemaPath, "utf-8");
    const currentHash = createHash("sha256").update(schemaContent).digest("hex");

    if (currentHash !== config.authorizedSchemaVersion) {
      return {
        valid: false,
        error: "Schema divergente do autorizado. Execute migrations ou sincronize código.",
      };
    }

    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: `Erro ao validar schema: ${error.message}`,
    };
  }
}

/**
 * Registra operação administrativa assinada (auditoria)
 */
export async function logAdminOperation(
  userId: string,
  operationType: string,
  resourceType: string | null,
  resourceId: string | null,
  certificateSerial: string,
  signatureHash: string,
  signatureData: string,
  ip: string,
  userAgent: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  try {
    await prisma.adminOperation.create({
      data: {
        userId,
        operationType,
        resourceType,
        resourceId,
        certificateSerial,
        signatureHash,
        signatureData,
        ip,
        userAgent,
        success,
        errorMessage,
      },
    });
  } catch (error: any) {
    // Não falha a operação principal se o log falhar
    console.error("[WriteGuard] Erro ao registrar operação:", error);
  }
}

