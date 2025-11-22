/*
  Warnings:

  - You are about to drop the `AdminSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ARQUITETO';

-- DropForeignKey
ALTER TABLE "AdminSession" DROP CONSTRAINT "AdminSession_userId_fkey";

-- DropTable
DROP TABLE "AdminSession";

-- CreateTable
CREATE TABLE "ArquitetoSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArquitetoSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArquitetoSession_userId_key" ON "ArquitetoSession"("userId");

-- CreateIndex
CREATE INDEX "ArquitetoSession_environment_idx" ON "ArquitetoSession"("environment");

-- CreateIndex
CREATE INDEX "ArquitetoSession_expiresAt_idx" ON "ArquitetoSession"("expiresAt");

-- CreateIndex
CREATE INDEX "ArquitetoSession_userId_idx" ON "ArquitetoSession"("userId");

-- AddForeignKey
ALTER TABLE "ArquitetoSession" ADD CONSTRAINT "ArquitetoSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
