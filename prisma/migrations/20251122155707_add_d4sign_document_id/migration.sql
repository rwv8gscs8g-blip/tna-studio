-- Add d4signDocumentId to Ensaio
ALTER TABLE "Ensaio" ADD COLUMN IF NOT EXISTS "d4signDocumentId" TEXT;
