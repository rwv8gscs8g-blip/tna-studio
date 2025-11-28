-- AlterTable
ALTER TABLE "Produto" ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Produto_displayOrder_idx" ON "Produto"("displayOrder");
