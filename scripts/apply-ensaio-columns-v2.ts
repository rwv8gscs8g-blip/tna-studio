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

    // Executar SQL diretamente, sem dividir em comandos separados
    const sql = `
-- 1. Adicionar colunas na tabela Ensaio (se não existirem)
DO $$
BEGIN
  -- Adicionar coverImageKey
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Ensaio' AND column_name = 'coverImageKey'
  ) THEN
    ALTER TABLE "Ensaio" ADD COLUMN "coverImageKey" TEXT;
  END IF;
  
  -- Adicionar termPdfKey
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Ensaio' AND column_name = 'termPdfKey'
  ) THEN
    ALTER TABLE "Ensaio" ADD COLUMN "termPdfKey" TEXT;
  END IF;
END $$;

-- 2. Adicionar coluna na tabela EnsaioPhoto (se não existir)
DO $$
BEGIN
  -- Adicionar storageKey
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'EnsaioPhoto' AND column_name = 'storageKey'
  ) THEN
    ALTER TABLE "EnsaioPhoto" ADD COLUMN "storageKey" TEXT;
  END IF;
END $$;

-- 3. Criar índice em storageKey se não existir
CREATE INDEX IF NOT EXISTS "EnsaioPhoto_storageKey_idx" ON "EnsaioPhoto"("storageKey");
    `.trim();

    // Executar o SQL completo
    await prisma.$executeRawUnsafe(sql);

    console.log("✅ SQL aplicado com sucesso!");
    
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

    if (ensaioColumns.some(c => c.column_name === 'coverImageKey') && 
        ensaioColumns.some(c => c.column_name === 'termPdfKey') && 
        photoColumns.length > 0) {
      console.log("\n🎉 Todas as colunas foram criadas com sucesso!");
    } else {
      console.log("\n⚠️ Algumas colunas não foram criadas. Verifique os logs acima.");
    }

  } catch (error: any) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

