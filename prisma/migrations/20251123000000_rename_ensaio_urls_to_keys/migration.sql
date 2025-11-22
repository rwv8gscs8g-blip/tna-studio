-- Migration: Renomear campos coverImageUrl/termPdfUrl para coverImageKey/termPdfKey e imageUrl para storageKey

-- 1. Renomear colunas na tabela Ensaio
DO $$
BEGIN
  -- Renomear coverImageUrl para coverImageKey (se existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Ensaio' AND column_name = 'coverImageUrl'
  ) THEN
    ALTER TABLE "Ensaio" RENAME COLUMN "coverImageUrl" TO "coverImageKey";
  END IF;
  
  -- Renomear termPdfUrl para termPdfKey (se existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Ensaio' AND column_name = 'termPdfUrl'
  ) THEN
    ALTER TABLE "Ensaio" RENAME COLUMN "termPdfUrl" TO "termPdfKey";
  END IF;
END $$;

-- 2. Renomear coluna na tabela EnsaioPhoto
DO $$
BEGIN
  -- Renomear imageUrl para storageKey (se existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'EnsaioPhoto' AND column_name = 'imageUrl'
  ) THEN
    ALTER TABLE "EnsaioPhoto" RENAME COLUMN "imageUrl" TO "storageKey";
  END IF;
END $$;

-- 3. Criar índice em storageKey se não existir
CREATE INDEX IF NOT EXISTS "EnsaioPhoto_storageKey_idx" ON "EnsaioPhoto"("storageKey");

