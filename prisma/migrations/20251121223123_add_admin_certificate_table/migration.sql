-- CreateTable
CREATE TABLE IF NOT EXISTS "AdminCertificate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "certificateHash" TEXT NOT NULL,
    "certificateEncrypted" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AdminCertificate_userId_key" ON "AdminCertificate"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdminCertificate_isActive_idx" ON "AdminCertificate"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdminCertificate_serialNumber_idx" ON "AdminCertificate"("serialNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdminCertificate_userId_idx" ON "AdminCertificate"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdminCertificate_validUntil_idx" ON "AdminCertificate"("validUntil");

-- AddForeignKey
ALTER TABLE "AdminCertificate" DROP CONSTRAINT IF EXISTS "AdminCertificate_createdBy_fkey";
ALTER TABLE "AdminCertificate" DROP CONSTRAINT IF EXISTS "AdminCertificate_userId_fkey";

ALTER TABLE "AdminCertificate" ADD CONSTRAINT "AdminCertificate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdminCertificate" ADD CONSTRAINT "AdminCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
