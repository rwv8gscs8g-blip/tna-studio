-- Migration: Adicionar subjectCpf ao modelo Ensaio
-- Relaciona Ensaio com User via CPF (apenas MODELO ou CLIENTE)

-- AlterTable: Adicionar campo subjectCpf
ALTER TABLE "Ensaio" ADD COLUMN "subjectCpf" TEXT;

-- CreateIndex
CREATE INDEX "Ensaio_subjectCpf_idx" ON "Ensaio"("subjectCpf");

-- AddForeignKey
ALTER TABLE "Ensaio" ADD CONSTRAINT "Ensaio_subjectCpf_fkey" FOREIGN KEY ("subjectCpf") REFERENCES "User"("cpf") ON DELETE CASCADE ON UPDATE CASCADE;

