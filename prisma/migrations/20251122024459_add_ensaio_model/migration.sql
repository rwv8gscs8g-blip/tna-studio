-- CreateTable
CREATE TABLE "Ensaio" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shootDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ensaio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ensaio_slug_key" ON "Ensaio"("slug");

-- CreateIndex
CREATE INDEX "Ensaio_createdById_idx" ON "Ensaio"("createdById");

-- CreateIndex
CREATE INDEX "Ensaio_slug_idx" ON "Ensaio"("slug");

-- CreateIndex
CREATE INDEX "Ensaio_status_idx" ON "Ensaio"("status");

-- CreateIndex
CREATE INDEX "Ensaio_shootDate_idx" ON "Ensaio"("shootDate");

-- AddForeignKey
ALTER TABLE "Ensaio" ADD CONSTRAINT "Ensaio_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
