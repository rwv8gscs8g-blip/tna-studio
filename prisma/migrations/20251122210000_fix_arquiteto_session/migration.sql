-- Migration: Corrigir ArquitetoSession garantindo que sessionId existe e é único
-- Remove campos extras e garante estrutura consistente com o schema

-- 1. Garantir que sessionId existe e é único
DO $$
BEGIN
  -- Se sessionId não existe, criar a coluna
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ArquitetoSession' AND column_name = 'sessionId'
  ) THEN
    ALTER TABLE "ArquitetoSession" ADD COLUMN "sessionId" TEXT;
    
    -- Preencher sessionId existentes com UUID único
    UPDATE "ArquitetoSession" 
    SET "sessionId" = gen_random_uuid()::text 
    WHERE "sessionId" IS NULL;
    
    -- Tornar sessionId obrigatório
    ALTER TABLE "ArquitetoSession" ALTER COLUMN "sessionId" SET NOT NULL;
  END IF;
  
  -- Garantir que sessionId é único (adicionar constraint se não existir)
  -- REMOVIDO: Constraint duplicado - já definido via @@unique([sessionId]) no schema
  -- IF NOT EXISTS (
  --   SELECT 1 FROM pg_constraint 
  --   WHERE conname = 'ArquitetoSession_sessionId_key'
  -- ) THEN
  --   ALTER TABLE "ArquitetoSession" ADD CONSTRAINT "ArquitetoSession_sessionId_key" UNIQUE ("sessionId");
  -- END IF;
END $$;

-- 2. Remover campos extras que não existem mais no schema
DO $$
BEGIN
  -- Remover índices de campos que serão removidos
  DROP INDEX IF EXISTS "ArquitetoSession_environment_idx";
  DROP INDEX IF EXISTS "ArquitetoSession_lastSeenAt_idx";
  DROP INDEX IF EXISTS "ArquitetoSession_ip_idx";
  DROP INDEX IF EXISTS "ArquitetoSession_userAgent_idx";
  
  -- Remover colunas extras se existirem
  ALTER TABLE "ArquitetoSession" DROP COLUMN IF EXISTS "environment";
  ALTER TABLE "ArquitetoSession" DROP COLUMN IF EXISTS "ip";
  ALTER TABLE "ArquitetoSession" DROP COLUMN IF EXISTS "userAgent";
  ALTER TABLE "ArquitetoSession" DROP COLUMN IF EXISTS "lastSeenAt";
  ALTER TABLE "ArquitetoSession" DROP COLUMN IF EXISTS "updatedAt";
END $$;

-- 3. Garantir que isActive existe e tem default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ArquitetoSession' AND column_name = 'isActive'
  ) THEN
    ALTER TABLE "ArquitetoSession" ADD COLUMN "isActive" BOOLEAN DEFAULT true;
  ELSE
    -- Garantir que isActive tem default
    ALTER TABLE "ArquitetoSession" ALTER COLUMN "isActive" SET DEFAULT true;
  END IF;
END $$;

-- 4. Garantir índices necessários (criar apenas se não existirem)
CREATE INDEX IF NOT EXISTS "ArquitetoSession_userId_idx" ON "ArquitetoSession"("userId");
CREATE INDEX IF NOT EXISTS "ArquitetoSession_sessionId_idx" ON "ArquitetoSession"("sessionId");
CREATE INDEX IF NOT EXISTS "ArquitetoSession_isActive_idx" ON "ArquitetoSession"("isActive");
CREATE INDEX IF NOT EXISTS "ArquitetoSession_expiresAt_idx" ON "ArquitetoSession"("expiresAt");

