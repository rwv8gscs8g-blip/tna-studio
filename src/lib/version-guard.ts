/**
 * Version Guard - Validação de Versões de Código e Migrations
 * 
 * Valida se código e migrations estão sincronizados com produção
 * antes de permitir operações administrativas.
 */

import { prisma } from "./prisma";

export interface VersionValidationResult {
  valid: boolean;
  codeVersionMatch: boolean;
  migrationVersionMatch: boolean;
  schemaVersionMatch: boolean;
  errors: string[];
  details: {
    localCodeVersion?: string;
    authorizedCodeVersion?: string;
    localMigrationVersion?: string;
    authorizedMigrationVersion?: string;
    localSchemaVersion?: string;
    authorizedSchemaVersion?: string;
  };
}

/**
 * Obtém versão atual do código (Git commit SHA)
 */
export function getCurrentCodeVersion(): string {
  // Vercel fornece automaticamente
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA;
  }

  // Localhost: variável de ambiente ou git
  if (process.env.GIT_COMMIT_SHA) {
    return process.env.GIT_COMMIT_SHA;
  }

  // Fallback: tentar git diretamente
  try {
    const { execSync } = require("child_process");
    return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

/**
 * Obtém última migration aplicada no banco
 */
export async function getCurrentMigrationVersion(): Promise<string | null> {
  try {
    const result = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name 
      FROM _prisma_migrations 
      WHERE finished_at IS NOT NULL 
      ORDER BY finished_at DESC 
      LIMIT 1
    `;
    return result[0]?.migration_name || null;
  } catch (error) {
    console.warn("[VersionGuard] Erro ao consultar migrations:", error);
    return null;
  }
}

/**
 * Obtém hash do schema atual
 */
export async function getCurrentSchemaVersion(): Promise<string> {
  try {
    const { readFileSync } = await import("fs");
    const { join } = await import("path");
    const { createHash } = await import("crypto");
    
    const schemaPath = join(process.cwd(), "prisma", "schema.prisma");
    const schemaContent = readFileSync(schemaPath, "utf-8");
    return createHash("sha256").update(schemaContent).digest("hex");
  } catch (error: any) {
    console.warn("[VersionGuard] Erro ao calcular hash do schema:", error);
    return "unknown";
  }
}

/**
 * Valida versões contra AppConfig
 */
export async function validateVersions(): Promise<VersionValidationResult> {
  const errors: string[] = [];
  const details: VersionValidationResult["details"] = {};

  // Obter versões atuais
  const localCodeVersion = getCurrentCodeVersion();
  const localMigrationVersion = await getCurrentMigrationVersion();
  const localSchemaVersion = await getCurrentSchemaVersion();

  details.localCodeVersion = localCodeVersion;
  details.localMigrationVersion = localMigrationVersion || undefined;
  details.localSchemaVersion = localSchemaVersion;

  // Consultar AppConfig
  let config = await prisma.appConfig.findUnique({
    where: { id: "singleton" },
  });

  // Se não existe, criar com versões atuais (primeira execução)
  if (!config) {
    config = await prisma.appConfig.create({
      data: {
        id: "singleton",
        authorizedCodeVersion: localCodeVersion,
        authorizedMigrationVersion: localMigrationVersion,
        authorizedSchemaVersion: localSchemaVersion,
        productionWriteEnabled: true,
        preStartValidationEnabled: true,
      },
    });
    
    console.log("[VersionGuard] AppConfig criado com versões atuais (primeira execução)");
    return {
      valid: true,
      codeVersionMatch: true,
      migrationVersionMatch: true,
      schemaVersionMatch: true,
      errors: [],
      details: {
        ...details,
        authorizedCodeVersion: localCodeVersion,
        authorizedMigrationVersion: localMigrationVersion || undefined,
        authorizedSchemaVersion: localSchemaVersion,
      },
    };
  }

  details.authorizedCodeVersion = config.authorizedCodeVersion || undefined;
  details.authorizedMigrationVersion = config.authorizedMigrationVersion || undefined;
  details.authorizedSchemaVersion = config.authorizedSchemaVersion || undefined;

  // Validar código
  const codeVersionMatch = !config.authorizedCodeVersion || 
                          localCodeVersion === config.authorizedCodeVersion;
  
  if (!codeVersionMatch) {
    errors.push(
      `Código divergente: local (${localCodeVersion.substring(0, 8)}) != autorizado (${config.authorizedCodeVersion?.substring(0, 8)})`
    );
  }

  // Validar migrations
  const migrationVersionMatch = !config.authorizedMigrationVersion ||
                               localMigrationVersion === config.authorizedMigrationVersion;
  
  if (!migrationVersionMatch) {
    errors.push(
      `Migration divergente: local (${localMigrationVersion}) != autorizado (${config.authorizedMigrationVersion})`
    );
  }

  // Validar schema
  const schemaVersionMatch = !config.authorizedSchemaVersion ||
                            localSchemaVersion === config.authorizedSchemaVersion;
  
  if (!schemaVersionMatch) {
    errors.push(
      `Schema divergente: local (${localSchemaVersion.substring(0, 8)}) != autorizado (${config.authorizedSchemaVersion?.substring(0, 8)})`
    );
  }

  return {
    valid: errors.length === 0,
    codeVersionMatch,
    migrationVersionMatch,
    schemaVersionMatch,
    errors,
    details,
  };
}

/**
 * Atualiza versões autorizadas (apenas Super User)
 */
export async function updateAuthorizedVersions(
  updatedBy: string,
  codeVersion?: string,
  migrationVersion?: string,
  schemaVersion?: string
): Promise<void> {
  const updateData: any = {
    updatedBy,
  };

  if (codeVersion) updateData.authorizedCodeVersion = codeVersion;
  if (migrationVersion) updateData.authorizedMigrationVersion = migrationVersion;
  if (schemaVersion) updateData.authorizedSchemaVersion = schemaVersion;

  await prisma.appConfig.update({
    where: { id: "singleton" },
    data: updateData,
  });
}

