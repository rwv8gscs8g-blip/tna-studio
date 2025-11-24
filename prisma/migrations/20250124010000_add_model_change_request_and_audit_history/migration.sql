-- Criar tabela ModelChangeRequest
CREATE TABLE IF NOT EXISTS "ModelChangeRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "valorAntigo" TEXT,
    "valorNovo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "aprovadoPor" TEXT,
    "motivoRejeicao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelChangeRequest_pkey" PRIMARY KEY ("id")
);

-- Criar tabela ModelAuditHistory
CREATE TABLE IF NOT EXISTS "ModelAuditHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "valorAntes" TEXT,
    "valorDepois" TEXT,
    "aprovadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelAuditHistory_pkey" PRIMARY KEY ("id")
);

-- Adicionar campos estilo Apple Contacts ao User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "middleName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "organization" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "jobTitle" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phones" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emails" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "birthday" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "postalStreet" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "postalNumber" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "postalCity" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "postalState" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "postalZip" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "postalCountry" TEXT;

-- Criar índices
CREATE INDEX IF NOT EXISTS "ModelChangeRequest_userId_idx" ON "ModelChangeRequest"("userId");
CREATE INDEX IF NOT EXISTS "ModelChangeRequest_status_idx" ON "ModelChangeRequest"("status");
CREATE INDEX IF NOT EXISTS "ModelChangeRequest_createdAt_idx" ON "ModelChangeRequest"("createdAt");
CREATE INDEX IF NOT EXISTS "ModelAuditHistory_userId_idx" ON "ModelAuditHistory"("userId");
CREATE INDEX IF NOT EXISTS "ModelAuditHistory_createdAt_idx" ON "ModelAuditHistory"("createdAt");
CREATE INDEX IF NOT EXISTS "ModelAuditHistory_campo_idx" ON "ModelAuditHistory"("campo");

-- Adicionar foreign keys
ALTER TABLE "ModelChangeRequest" ADD CONSTRAINT "ModelChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModelChangeRequest" ADD CONSTRAINT "ModelChangeRequest_aprovadoPor_fkey" FOREIGN KEY ("aprovadoPor") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ModelAuditHistory" ADD CONSTRAINT "ModelAuditHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModelAuditHistory" ADD CONSTRAINT "ModelAuditHistory_aprovadoPor_fkey" FOREIGN KEY ("aprovadoPor") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

