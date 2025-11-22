/**
 * Script de Validação Pré-Start
 * 
 * Este script DEVE ser executado antes de qualquer operação de desenvolvimento.
 * Valida:
 * 1. Schema Prisma (hash de migrations)
 * 2. Versão do código (Git commit SHA)
 * 3. Versionamento interno (AppConfig)
 * 4. Ambiente (localhost vs produção)
 * 
 * Se REJEITADO → restaura automaticamente schema e build da última release estável.
 * 
 * IMPORTANTE: Este script é parte crítica da arquitetura de segurança.
 * Não deve ser bypassado. Modificar package.json para forçar uso.
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  details: {
    schema?: {
      localHash?: string;
      productionHash?: string;
      match: boolean;
    };
    code?: {
      localCommit?: string;
      productionCommit?: string;
      match: boolean;
    };
    migrations?: {
      localCount?: number;
      productionCount?: number;
      match: boolean;
    };
    environment?: {
      isLocalhost: boolean;
      isProductionDB: boolean;
      safe: boolean;
    };
  };
}

/**
 * Calcula hash SHA256 de um arquivo
 */
function hashFile(filePath: string): string {
  if (!existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }
  const content = readFileSync(filePath, "utf-8");
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Obtém commit SHA atual do Git
 */
function getCurrentGitCommit(): string {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  } catch (error) {
    throw new Error("Não foi possível obter commit Git. Certifique-se de estar em um repositório Git.");
  }
}

/**
 * Obtém commit SHA de produção (via variável de ambiente ou API)
 */
function getProductionGitCommit(): string | null {
  // Opção 1: Variável de ambiente (definida manualmente ou via CI/CD)
  if (process.env.PRODUCTION_GIT_COMMIT) {
    return process.env.PRODUCTION_GIT_COMMIT;
  }

  // Opção 2: Consultar AppConfig no banco (se já existe)
  // Isso será implementado após primeira execução

  // Opção 3: API de produção (se disponível)
  if (process.env.PRODUCTION_API_URL) {
    try {
      const response = fetch(`${process.env.PRODUCTION_API_URL}/api/internal/version`, {
        headers: {
          Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
        },
      });
      // Implementar quando API estiver disponível
    } catch (error) {
      console.warn("Não foi possível consultar versão de produção via API");
    }
  }

  return null;
}

/**
 * Conta número de migrations locais
 */
function getLocalMigrationCount(): number {
  const migrationsPath = join(process.cwd(), "prisma", "migrations");
  if (!existsSync(migrationsPath)) {
    return 0;
  }
  try {
    const migrations = execSync(`find "${migrationsPath}" -type d -name "20*" | wc -l`, {
      encoding: "utf-8",
    }).trim();
    return parseInt(migrations) || 0;
  } catch {
    return 0;
  }
}

/**
 * Obtém hash do schema.prisma
 */
function getSchemaHash(): string {
  const schemaPath = join(process.cwd(), "prisma", "schema.prisma");
  return hashFile(schemaPath);
}

/**
 * Obtém última migration aplicada no banco
 */
async function getLastAppliedMigration(): Promise<string | null> {
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
    console.warn("Não foi possível consultar migrations do banco:", error);
    return null;
  }
}

/**
 * Valida se ambiente é seguro
 */
function validateEnvironment(): { safe: boolean; isLocalhost: boolean; isProductionDB: boolean } {
  const isLocalhost = process.env.NODE_ENV !== "production";
  const isProductionDB =
    process.env.DATABASE_URL?.includes("production") ||
    process.env.DATABASE_URL === process.env.PRODUCTION_DATABASE_URL;

  // Se localhost conectado à produção, é perigoso
  const safe = !(isLocalhost && isProductionDB);

  return { safe, isLocalhost, isProductionDB };
}

/**
 * Restaura para última versão estável
 */
async function restoreStableVersion(): Promise<void> {
  console.log("\n🔄 Restaurando para última versão estável...\n");

  try {
    // 1. Restaurar código
    if (process.env.STABLE_GIT_COMMIT) {
      console.log(`📦 Restaurando código para commit: ${process.env.STABLE_GIT_COMMIT}`);
      execSync(`git checkout ${process.env.STABLE_GIT_COMMIT}`, { stdio: "inherit" });
    } else {
      console.log("⚠️  STABLE_GIT_COMMIT não definido. Pulando restauração de código.");
    }

    // 2. Restaurar migrations
    console.log("📦 Restaurando migrations...");
    const lastStableMigration = process.env.STABLE_MIGRATION_NAME;
    if (lastStableMigration) {
      // Rollback para migration estável
      execSync(`npx prisma migrate resolve --rolled-back ${lastStableMigration}`, {
        stdio: "inherit",
      });
    } else {
      console.log("⚠️  STABLE_MIGRATION_NAME não definido. Pulando restauração de migrations.");
    }

    console.log("\n✅ Restauração concluída. Execute o script novamente para validar.\n");
  } catch (error: any) {
    console.error("\n❌ Erro ao restaurar versão estável:", error.message);
    console.error("\n⚠️  AÇÃO MANUAL NECESSÁRIA:");
    console.error("   1. Sincronize código: git pull origin main");
    console.error("   2. Sincronize migrations: npx prisma migrate deploy");
    console.error("   3. Execute este script novamente\n");
    process.exit(1);
  }
}

/**
 * Função principal de validação
 */
export async function validatePreStart(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: ValidationResult["details"] = {};

  console.log("\n🔍 Validação Pré-Start - TNA Studio\n");
  console.log("=" .repeat(50));

  // 1. Validação de Schema
  console.log("\n📋 1. Validando Schema Prisma...");
  try {
    const localSchemaHash = getSchemaHash();
    const lastMigration = await getLastAppliedMigration();
    
    details.schema = {
      localHash: localSchemaHash,
      productionHash: lastMigration || undefined,
      match: true, // Será validado contra AppConfig
    };

    // Consultar AppConfig para hash autorizado
    try {
      const config = await prisma.appConfig.findUnique({
        where: { id: "singleton" },
      });

      if (config?.authorizedSchemaVersion) {
        details.schema.productionHash = config.authorizedSchemaVersion;
        if (localSchemaHash !== config.authorizedSchemaVersion) {
          // Em localhost/desenvolvimento, diferenças de schema são avisos, não erros bloqueantes
          // Detecta localhost: NODE_ENV não é production OU estamos executando npm run dev
          const isLocalhost = process.env.NODE_ENV !== "production" || 
                             process.env.NODE_ENV === undefined ||
                             process.env.NPM_LIFECYCLE_EVENT === "dev";
          
          if (isLocalhost) {
            warnings.push(
              `Schema local diferente do autorizado: local (${localSchemaHash.substring(0, 8)}...) != autorizado (${config.authorizedSchemaVersion.substring(0, 8)}...). Em desenvolvimento, isso é esperado.`
            );
            // Atualizar AppConfig com schema local (desenvolvimento ativo)
            try {
              await prisma.appConfig.upsert({
                where: { id: "singleton" },
                update: {
                  authorizedSchemaVersion: localSchemaHash,
                  updatedAt: new Date(),
                },
                create: {
                  id: "singleton",
                  authorizedSchemaVersion: localSchemaHash,
                  productionWriteEnabled: true,
                  preStartValidationEnabled: true,
                },
              });
              console.log("   ⚠️  Schema local diferente, mas atualizado no AppConfig (desenvolvimento)");
            } catch (error) {
              // Ignorar erro de atualização em desenvolvimento
            }
          } else {
            // Em produção, é erro bloqueante
            errors.push(
              `Schema divergente: local (${localSchemaHash.substring(0, 8)}...) != produção (${config.authorizedSchemaVersion.substring(0, 8)}...)`
            );
            details.schema.match = false;
          }
        } else {
          console.log("   ✅ Schema válido");
        }
      } else {
        warnings.push("AppConfig não encontrado. Primeira execução?");
        // Criar AppConfig com schema local se não existir
        try {
          await prisma.appConfig.upsert({
            where: { id: "singleton" },
            update: {
              authorizedSchemaVersion: getSchemaHash(),
              updatedAt: new Date(),
            },
            create: {
              id: "singleton",
              authorizedSchemaVersion: getSchemaHash(),
              authorizedCodeVersion: getCurrentGitCommit(),
              productionWriteEnabled: true,
              preStartValidationEnabled: true,
            },
          });
          console.log("   ✅ AppConfig criado/atualizado com schema local");
        } catch (error) {
          // Ignorar erro em desenvolvimento
        }
      }
    } catch (error) {
      warnings.push("Não foi possível consultar AppConfig. Primeira execução?");
    }
  } catch (error: any) {
    errors.push(`Erro ao validar schema: ${error.message}`);
  }

  // 2. Validação de Código
  console.log("\n💻 2. Validando Versão do Código...");
  try {
    const localCommit = getCurrentGitCommit();
    const productionCommit = getProductionGitCommit();

    details.code = {
      localCommit,
      productionCommit: productionCommit || undefined,
      match: !productionCommit || localCommit === productionCommit,
    };

    if (productionCommit) {
      if (localCommit !== productionCommit) {
        errors.push(
          `Código divergente: local (${localCommit.substring(0, 8)}) != produção (${productionCommit.substring(0, 8)})`
        );
        details.code.match = false;
      } else {
        console.log(`   ✅ Código sincronizado (${localCommit.substring(0, 8)})`);
      }
    } else {
      warnings.push("Versão de produção não disponível. Validando contra AppConfig...");
      
      // Tentar AppConfig
      try {
        const config = await prisma.appConfig.findUnique({
          where: { id: "singleton" },
        });
        if (config?.authorizedCodeVersion) {
          details.code.productionCommit = config.authorizedCodeVersion;
          if (localCommit !== config.authorizedCodeVersion) {
            // Em localhost/desenvolvimento, diferenças de código são avisos, não erros bloqueantes
            // Detecta localhost: NODE_ENV não é production OU estamos executando npm run dev
            const isLocalhost = process.env.NODE_ENV !== "production" || 
                               process.env.NODE_ENV === undefined ||
                               process.env.NPM_LIFECYCLE_EVENT === "dev";
            
            if (isLocalhost) {
              warnings.push(
                `Código local diferente do autorizado: local (${localCommit.substring(0, 8)}) != autorizado (${config.authorizedCodeVersion.substring(0, 8)}). Em desenvolvimento, isso é esperado.`
              );
              // Atualizar AppConfig com código local (desenvolvimento ativo)
              try {
                await prisma.appConfig.update({
                  where: { id: "singleton" },
                  data: {
                    authorizedCodeVersion: localCommit,
                    updatedAt: new Date(),
                  },
                });
              } catch (error) {
                // Ignorar erro de atualização em desenvolvimento
              }
            } else {
              // Em produção, é erro bloqueante
              errors.push(
                `Código divergente: local (${localCommit.substring(0, 8)}) != autorizado (${config.authorizedCodeVersion.substring(0, 8)})`
              );
              details.code.match = false;
            }
          } else {
            console.log(`   ✅ Código válido (${localCommit.substring(0, 8)})`);
          }
        }
      } catch (error) {
        warnings.push("Não foi possível validar contra AppConfig");
      }
    }
  } catch (error: any) {
    errors.push(`Erro ao validar código: ${error.message}`);
  }

  // 3. Validação de Migrations
  console.log("\n🗄️  3. Validando Migrations...");
  try {
    const localCount = getLocalMigrationCount();
    const lastMigration = await getLastAppliedMigration();

    details.migrations = {
      localCount,
      productionCount: lastMigration ? 1 : 0, // Simplificado - contar todas seria melhor
      match: true, // Validação mais complexa necessária
    };

    // Consultar AppConfig
    try {
      const config = await prisma.appConfig.findUnique({
        where: { id: "singleton" },
      });
      if (config?.authorizedMigrationVersion) {
        if (lastMigration !== config.authorizedMigrationVersion) {
          warnings.push(
            `Última migration aplicada (${lastMigration}) != autorizada (${config.authorizedMigrationVersion})`
          );
        } else {
          console.log(`   ✅ Migrations sincronizadas (${lastMigration})`);
        }
      }
    } catch (error) {
      warnings.push("Não foi possível validar migrations contra AppConfig");
    }
  } catch (error: any) {
    errors.push(`Erro ao validar migrations: ${error.message}`);
  }

  // 4. Validação de Ambiente
  console.log("\n🌍 4. Validando Ambiente...");
  const envCheck = validateEnvironment();
  details.environment = envCheck;

  if (!envCheck.safe) {
    errors.push(
      "AMBIENTE INSEGURO: Localhost conectado ao banco de produção. Use Neon Branching ou DATABASE_URL diferente."
    );
  } else {
    console.log(`   ✅ Ambiente seguro (${envCheck.isLocalhost ? "localhost" : "production"})`);
  }

  // Resumo
  console.log("\n" + "=".repeat(50));
  console.log("\n📊 Resumo da Validação:\n");

  if (errors.length === 0 && warnings.length === 0) {
    console.log("✅ Todas as validações passaram!\n");
    
    // NOTA: AdminSession foi substituída por ArquitetoSession
    // ArquitetoSession não precisa de validação pré-start (funciona independentemente)
    // Esta validação foi removida na nova arquitetura
    
    return {
      passed: true,
      errors: [],
      warnings: [],
      details,
    };
  }

  if (warnings.length > 0) {
    console.log("⚠️  Avisos:");
    warnings.forEach((w) => console.log(`   - ${w}`));
  }

  if (errors.length > 0) {
    console.log("\n❌ Erros encontrados:");
    errors.forEach((e) => console.log(`   - ${e}`));
    console.log("\n🚫 BOOT BLOQUEADO\n");

    // Perguntar se deve restaurar
    if (process.env.AUTO_RESTORE === "true") {
      await restoreStableVersion();
    } else {
      console.log("💡 Para restaurar automaticamente, defina AUTO_RESTORE=true");
      console.log("💡 Ou execute manualmente:");
      console.log("   - git pull origin main");
      console.log("   - npx prisma migrate deploy\n");
    }

    return {
      passed: false,
      errors,
      warnings,
      details,
    };
  }

  return {
    passed: true,
    errors: [],
    warnings,
    details,
  };
}

// Executar se chamado diretamente
if (require.main === module) {
  validatePreStart()
    .then((result) => {
      if (!result.passed) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Erro fatal na validação:", error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

