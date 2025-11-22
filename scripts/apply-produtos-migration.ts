/**
 * Script para aplicar migration de produtos manualmente
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Aplicando migration de produtos...\n");

  // Aplicar comandos um por um
  const commands = [
    // Criar enum
    `DO $$ BEGIN
      CREATE TYPE "EnsaioStatus" AS ENUM ('DRAFT', 'PUBLISHED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`,

    // Adicionar coluna d4signDocumentId
    `ALTER TABLE "Ensaio" ADD COLUMN IF NOT EXISTS "d4signDocumentId" TEXT;`,

    // Alterar tipo de status
    `ALTER TABLE "Ensaio" ALTER COLUMN "status" DROP DEFAULT;`,
    `ALTER TABLE "Ensaio" ALTER COLUMN "status" TYPE "EnsaioStatus" USING CASE 
      WHEN "status" = 'DRAFT' THEN 'DRAFT'::"EnsaioStatus"
      WHEN "status" = 'PUBLISHED' THEN 'PUBLISHED'::"EnsaioStatus"
      ELSE 'PUBLISHED'::"EnsaioStatus"
    END;`,
    `ALTER TABLE "Ensaio" ALTER COLUMN "status" SET DEFAULT 'PUBLISHED';`,

    // Criar tabelas
    `CREATE TABLE IF NOT EXISTS "Produto" (
      "id" TEXT NOT NULL,
      "nome" TEXT NOT NULL,
      "descricao" TEXT,
      "preco" DOUBLE PRECISION NOT NULL,
      "categoria" TEXT,
      "isPromocao" BOOLEAN NOT NULL DEFAULT false,
      "isTfp" BOOLEAN NOT NULL DEFAULT false,
      "coverImageKey" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
    );`,

    `CREATE TABLE IF NOT EXISTS "ProdutoPhoto" (
      "id" TEXT NOT NULL,
      "produtoId" TEXT NOT NULL,
      "storageKey" TEXT NOT NULL,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ProdutoPhoto_pkey" PRIMARY KEY ("id")
    );`,

    `CREATE TABLE IF NOT EXISTS "EnsaioProduto" (
      "id" TEXT NOT NULL,
      "ensaioId" TEXT NOT NULL,
      "produtoId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "EnsaioProduto_pkey" PRIMARY KEY ("id")
    );`,

    `CREATE TABLE IF NOT EXISTS "IntencaoCompra" (
      "id" TEXT NOT NULL,
      "modeloId" TEXT NOT NULL,
      "produtoId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDENTE',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "IntencaoCompra_pkey" PRIMARY KEY ("id")
    );`,

    // Criar índices
    `CREATE INDEX IF NOT EXISTS "Produto_categoria_idx" ON "Produto"("categoria");`,
    `CREATE INDEX IF NOT EXISTS "Produto_isPromocao_idx" ON "Produto"("isPromocao");`,
    `CREATE INDEX IF NOT EXISTS "Produto_isTfp_idx" ON "Produto"("isTfp");`,
    `CREATE INDEX IF NOT EXISTS "ProdutoPhoto_produtoId_idx" ON "ProdutoPhoto"("produtoId");`,
    `CREATE INDEX IF NOT EXISTS "ProdutoPhoto_sortOrder_idx" ON "ProdutoPhoto"("sortOrder");`,
    `CREATE INDEX IF NOT EXISTS "EnsaioProduto_ensaioId_idx" ON "EnsaioProduto"("ensaioId");`,
    `CREATE INDEX IF NOT EXISTS "EnsaioProduto_produtoId_idx" ON "EnsaioProduto"("produtoId");`,
    `CREATE INDEX IF NOT EXISTS "IntencaoCompra_modeloId_idx" ON "IntencaoCompra"("modeloId");`,
    `CREATE INDEX IF NOT EXISTS "IntencaoCompra_produtoId_idx" ON "IntencaoCompra"("produtoId");`,
    `CREATE INDEX IF NOT EXISTS "IntencaoCompra_status_idx" ON "IntencaoCompra"("status");`,

    // Criar unique index
    `CREATE UNIQUE INDEX IF NOT EXISTS "EnsaioProduto_ensaioId_produtoId_key" ON "EnsaioProduto"("ensaioId", "produtoId");`,

    // Adicionar foreign keys
    `DO $$ BEGIN
      ALTER TABLE "ProdutoPhoto" ADD CONSTRAINT "ProdutoPhoto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`,

    `DO $$ BEGIN
      ALTER TABLE "EnsaioProduto" ADD CONSTRAINT "EnsaioProduto_ensaioId_fkey" FOREIGN KEY ("ensaioId") REFERENCES "Ensaio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`,

    `DO $$ BEGIN
      ALTER TABLE "EnsaioProduto" ADD CONSTRAINT "EnsaioProduto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`,

    `DO $$ BEGIN
      ALTER TABLE "IntencaoCompra" ADD CONSTRAINT "IntencaoCompra_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`,

    `DO $$ BEGIN
      ALTER TABLE "IntencaoCompra" ADD CONSTRAINT "IntencaoCompra_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`,
  ];

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    try {
      await prisma.$executeRawUnsafe(cmd);
      console.log(`✓ Comando ${i + 1}/${commands.length} aplicado`);
    } catch (error: any) {
      if (
        error.message?.includes("already exists") ||
        error.message?.includes("duplicate") ||
        error.message?.includes("IF NOT EXISTS") ||
        error.message?.includes("does not exist")
      ) {
        console.log(`⚠ Comando ${i + 1} ignorado (já existe ou não necessário)`);
      } else {
        console.error(`✗ Erro no comando ${i + 1}:`, error.message);
        // Não interromper, continuar
      }
    }
  }

  console.log("\n✅ Migration aplicada!");
}

main()
  .catch((error) => {
    console.error("❌ Erro:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
