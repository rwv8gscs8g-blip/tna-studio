-- CreateTable
CREATE TABLE "Projeto" (
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
CREATE TABLE "EnsaioProjeto" (
    "id" TEXT NOT NULL,
    "ensaioId" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnsaioProjeto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Projeto_slug_key" ON "Projeto"("slug");

-- CreateIndex
CREATE INDEX "Projeto_slug_idx" ON "Projeto"("slug");

-- CreateIndex
CREATE INDEX "Projeto_active_idx" ON "Projeto"("active");

-- CreateIndex
CREATE UNIQUE INDEX "EnsaioProjeto_ensaioId_projetoId_key" ON "EnsaioProjeto"("ensaioId", "projetoId");

-- CreateIndex
CREATE INDEX "EnsaioProjeto_ensaioId_idx" ON "EnsaioProjeto"("ensaioId");

-- CreateIndex
CREATE INDEX "EnsaioProjeto_projetoId_idx" ON "EnsaioProjeto"("projetoId");

-- AddForeignKey
ALTER TABLE "EnsaioProjeto" ADD CONSTRAINT "EnsaioProjeto_ensaioId_fkey" FOREIGN KEY ("ensaioId") REFERENCES "Ensaio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnsaioProjeto" ADD CONSTRAINT "EnsaioProjeto_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

