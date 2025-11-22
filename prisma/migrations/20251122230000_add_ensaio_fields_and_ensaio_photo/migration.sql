-- AlterTable: Add new fields to Ensaio
ALTER TABLE "Ensaio" ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT;
ALTER TABLE "Ensaio" ADD COLUMN IF NOT EXISTS "termPdfUrl" TEXT;
ALTER TABLE "Ensaio" ADD COLUMN IF NOT EXISTS "syncFolderUrl" TEXT;

-- CreateTable: Create EnsaioPhoto table
CREATE TABLE IF NOT EXISTS "EnsaioPhoto" (
    "id" TEXT NOT NULL,
    "ensaioId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnsaioPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EnsaioPhoto_ensaioId_idx" ON "EnsaioPhoto"("ensaioId");
CREATE INDEX IF NOT EXISTS "EnsaioPhoto_sortOrder_idx" ON "EnsaioPhoto"("sortOrder");

-- AddForeignKey
ALTER TABLE "EnsaioPhoto" ADD CONSTRAINT "EnsaioPhoto_ensaioId_fkey" FOREIGN KEY ("ensaioId") REFERENCES "Ensaio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

