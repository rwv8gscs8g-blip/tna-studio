-- CreateEnum
CREATE TYPE "EnsaioStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "Ensaio" ADD COLUMN IF NOT EXISTS "d4signDocumentId" TEXT;
ALTER TABLE "Ensaio" ALTER COLUMN "status" TYPE "EnsaioStatus" USING "status"::text::"EnsaioStatus";
ALTER TABLE "Ensaio" ALTER COLUMN "status" SET DEFAULT 'PUBLISHED';

-- CreateTable
CREATE TABLE IF NOT EXISTS "Produto" (
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
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProdutoPhoto" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProdutoPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EnsaioProduto" (
    "id" TEXT NOT NULL,
    "ensaioId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnsaioProduto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "IntencaoCompra" (
    "id" TEXT NOT NULL,
    "modeloId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntencaoCompra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Produto_categoria_idx" ON "Produto"("categoria");
CREATE INDEX IF NOT EXISTS "Produto_isPromocao_idx" ON "Produto"("isPromocao");
CREATE INDEX IF NOT EXISTS "Produto_isTfp_idx" ON "Produto"("isTfp");
CREATE INDEX IF NOT EXISTS "ProdutoPhoto_produtoId_idx" ON "ProdutoPhoto"("produtoId");
CREATE INDEX IF NOT EXISTS "ProdutoPhoto_sortOrder_idx" ON "ProdutoPhoto"("sortOrder");
CREATE INDEX IF NOT EXISTS "EnsaioProduto_ensaioId_idx" ON "EnsaioProduto"("ensaioId");
CREATE INDEX IF NOT EXISTS "EnsaioProduto_produtoId_idx" ON "EnsaioProduto"("produtoId");
CREATE INDEX IF NOT EXISTS "IntencaoCompra_modeloId_idx" ON "IntencaoCompra"("modeloId");
CREATE INDEX IF NOT EXISTS "IntencaoCompra_produtoId_idx" ON "IntencaoCompra"("produtoId");
CREATE INDEX IF NOT EXISTS "IntencaoCompra_status_idx" ON "IntencaoCompra"("status");

-- CreateUniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EnsaioProduto_ensaioId_produtoId_key" ON "EnsaioProduto"("ensaioId", "produtoId");

-- AddForeignKey
ALTER TABLE "ProdutoPhoto" ADD CONSTRAINT "ProdutoPhoto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EnsaioProduto" ADD CONSTRAINT "EnsaioProduto_ensaioId_fkey" FOREIGN KEY ("ensaioId") REFERENCES "Ensaio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EnsaioProduto" ADD CONSTRAINT "EnsaioProduto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntencaoCompra" ADD CONSTRAINT "IntencaoCompra_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntencaoCompra" ADD CONSTRAINT "IntencaoCompra_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

