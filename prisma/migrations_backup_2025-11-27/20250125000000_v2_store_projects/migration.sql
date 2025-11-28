-- AlterTable: Produto
-- Adicionar slug (nullable primeiro, depois popular e tornar obrigatório)
ALTER TABLE "Produto" ADD COLUMN "slug" TEXT;

-- Migrar dados: criar slug a partir do nome
UPDATE "Produto" SET "slug" = LOWER(REGEXP_REPLACE("nome", '[^a-zA-Z0-9]+', '-', 'g'));

-- Adicionar unique constraint em slug
CREATE UNIQUE INDEX "Produto_slug_key" ON "Produto"("slug");

-- Renomear e adicionar campos
ALTER TABLE "Produto" RENAME COLUMN "descricao" TO "shortDescription";
ALTER TABLE "Produto" ADD COLUMN "fullDescription" TEXT;
ALTER TABLE "Produto" RENAME COLUMN "preco" TO "precoEuro";
ALTER TABLE "Produto" ALTER COLUMN "precoEuro" DROP NOT NULL;
ALTER TABLE "Produto" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Remover colunas antigas
ALTER TABLE "Produto" DROP COLUMN "isPromocao";
ALTER TABLE "Produto" DROP COLUMN "isTfp";

-- Criar índices
CREATE INDEX "Produto_slug_idx" ON "Produto"("slug");
CREATE INDEX "Produto_isActive_idx" ON "Produto"("isActive");

-- AlterTable: Projeto
ALTER TABLE "Projeto" ADD COLUMN "fullDescription" TEXT;
ALTER TABLE "Projeto" ADD COLUMN "rules" TEXT;

