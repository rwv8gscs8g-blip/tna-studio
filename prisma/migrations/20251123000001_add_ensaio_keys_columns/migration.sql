-- Migration: Adicionar colunas coverImageKey, termPdfKey e storageKey
-- Mantém as colunas antigas (coverImageUrl, termPdfUrl, imageUrl) por compatibilidade durante a transição

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
  
  -- syncFolderUrl já existe, não precisa adicionar
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

