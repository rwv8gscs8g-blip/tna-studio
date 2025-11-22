/**
 * Script para aplicar as colunas coverImageKey, termPdfKey e storageKey diretamente no banco
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("🔧 Aplicando SQL da migration diretamente no banco...\n");

    // Ler o SQL da migration
    const migrationPath = join(process.cwd(), "prisma/migrations/20251123000001_add_ensaio_keys_columns/migration.sql");
    const sql = readFileSync(migrationPath, "utf-8");

    // Dividir o SQL em comandos individuais (removendo blocos DO $$)
    // Executar cada comando SQL separadamente
    const statements = sql
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          // Executar comandos DDL diretamente
          await prisma.$executeRawUnsafe(statement);
          console.log(`✓ Executado: ${statement.substring(0, 60)}...`);
        } catch (err: any) {
          // Ignorar erros de "já existe" ou "não existe"
          if (!err.message.includes("already exists") && !err.message.includes("does not exist")) {
            console.warn(`⚠️ Aviso: ${err.message}`);
          }
        }
      }
    }

    console.log("\n✅ SQL aplicado com sucesso!");
    
    // Verificar se as colunas foram criadas
    const ensaioColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Ensaio' AND column_name IN ('coverImageKey', 'termPdfKey')
      ORDER BY column_name;
    `;

    const photoColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'EnsaioPhoto' AND column_name = 'storageKey';
    `;

    console.log("\n📊 Verificação final:");
    console.log(`  - coverImageKey: ${ensaioColumns.some(c => c.column_name === 'coverImageKey') ? '✓' : '✗'}`);
    console.log(`  - termPdfKey: ${ensaioColumns.some(c => c.column_name === 'termPdfKey') ? '✓' : '✗'}`);
    console.log(`  - storageKey: ${photoColumns.length > 0 ? '✓' : '✗'}`);

  } catch (error: any) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

