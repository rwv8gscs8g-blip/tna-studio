-- Migration: Atualizar ArquitetoSession para suportar múltiplas sessões
-- Permite múltiplas sessões do mesmo usuário, mas apenas a mais recente fica ativa

-- Remover constraint unique de userId (permite múltiplas sessões)
ALTER TABLE "ArquitetoSession" DROP CONSTRAINT IF EXISTS "ArquitetoSession_userId_key";

-- Adicionar campos novos
ALTER TABLE "ArquitetoSession" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;
ALTER TABLE "ArquitetoSession" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "ArquitetoSession" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ArquitetoSession" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

-- Atualizar updatedAt para os registros existentes
UPDATE "ArquitetoSession" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
UPDATE "ArquitetoSession" SET "lastSeenAt" = "createdAt" WHERE "lastSeenAt" IS NULL;

-- Criar índices
CREATE INDEX IF NOT EXISTS "ArquitetoSession_sessionId_idx" ON "ArquitetoSession"("sessionId");
CREATE INDEX IF NOT EXISTS "ArquitetoSession_isActive_idx" ON "ArquitetoSession"("isActive");
CREATE INDEX IF NOT EXISTS "ArquitetoSession_lastSeenAt_idx" ON "ArquitetoSession"("lastSeenAt");

-- Criar constraint unique para sessionId (cada sessão tem ID único)
CREATE UNIQUE INDEX IF NOT EXISTS "ArquitetoSession_sessionId_key" ON "ArquitetoSession"("sessionId");

