/**
 * Script para aplicar a migration de Projetos diretamente no banco
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("🔧 Aplicando migration de Projetos...\n");

    // Executar SQL da migration
    const sql = `
-- CreateTable
CREATE TABLE IF NOT EXISTS "Projeto" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EnsaioProjeto" (
    "id" TEXT NOT NULL,
    "ensaioId" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EnsaioProjeto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Projeto_slug_key" ON "Projeto"("slug");
CREATE INDEX IF NOT EXISTS "Projeto_slug_idx" ON "Projeto"("slug");
CREATE INDEX IF NOT EXISTS "Projeto_active_idx" ON "Projeto"("active");
CREATE UNIQUE INDEX IF NOT EXISTS "EnsaioProjeto_ensaioId_projetoId_key" ON "EnsaioProjeto"("ensaioId", "projetoId");
CREATE INDEX IF NOT EXISTS "EnsaioProjeto_ensaioId_idx" ON "EnsaioProjeto"("ensaioId");
CREATE INDEX IF NOT EXISTS "EnsaioProjeto_projetoId_idx" ON "EnsaioProjeto"("projetoId");

-- AddForeignKey (verificar se não existe antes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EnsaioProjeto_ensaioId_fkey'
  ) THEN
    ALTER TABLE "EnsaioProjeto" ADD CONSTRAINT "EnsaioProjeto_ensaioId_fkey" 
    FOREIGN KEY ("ensaioId") REFERENCES "Ensaio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EnsaioProjeto_projetoId_fkey'
  ) THEN
    ALTER TABLE "EnsaioProjeto" ADD CONSTRAINT "EnsaioProjeto_projetoId_fkey" 
    FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
    `.trim();

    // Executar cada comando separadamente
    const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log(`✓ Executado: ${statement.substring(0, 60)}...`);
        } catch (err: any) {
          if (!err.message.includes("already exists") && !err.message.includes("duplicate")) {
            console.warn(`⚠️ Aviso: ${err.message}`);
          }
        }
      }
    }

    console.log("\n✅ Migration de Projetos aplicada com sucesso!");

  } catch (error: any) {
    console.error("❌ Erro ao aplicar migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

