/*
  Warnings:

  - A unique constraint covering the columns `[termDocumentId]` on the table `Gallery` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cpf]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passport]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- DropForeignKey
ALTER TABLE "Gallery" DROP CONSTRAINT "Gallery_userId_fkey";

-- AlterTable
ALTER TABLE "Gallery" ADD COLUMN     "ownerCpf" TEXT,
ADD COLUMN     "ownerPassport" TEXT,
ADD COLUMN     "sessionDate" TIMESTAMP(3),
ADD COLUMN     "syncLink" TEXT,
ADD COLUMN     "syncPassword" TEXT,
ADD COLUMN     "termDocumentId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "hash" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "address" TEXT,
ADD COLUMN     "adminMessage" TEXT,
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "gdprAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lgpdAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passport" TEXT,
ADD COLUMN     "personalDescription" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "profileImage" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "zipCode" TEXT;

-- CreateTable
CREATE TABLE "OtpToken" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "cpf" TEXT,
    "passport" TEXT,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "role" "Role",
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "method" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "sessionTime" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermDocument" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminMessage" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetUserId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "authorizedCodeVersion" TEXT,
    "authorizedSchemaVersion" TEXT,
    "authorizedMigrationVersion" TEXT,
    "productionWriteEnabled" BOOLEAN NOT NULL DEFAULT true,
    "preStartValidationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "codeVersion" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "migrationVersion" TEXT NOT NULL,
    "writeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastValidatedAt" TIMESTAMP(3),
    "preStartValidated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminCertificate" (
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

-- CreateTable
CREATE TABLE "AdminOperation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "certificateSerial" TEXT NOT NULL,
    "signatureHash" TEXT NOT NULL,
    "signatureData" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OtpToken_phone_otp_idx" ON "OtpToken"("phone", "otp");

-- CreateIndex
CREATE INDEX "OtpToken_expiresAt_idx" ON "OtpToken"("expiresAt");

-- CreateIndex
CREATE INDEX "OtpToken_userId_idx" ON "OtpToken"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_email_idx" ON "AuditLog"("email");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "TermDocument_galleryId_key" ON "TermDocument"("galleryId");

-- CreateIndex
CREATE INDEX "TermDocument_galleryId_idx" ON "TermDocument"("galleryId");

-- CreateIndex
CREATE INDEX "TermDocument_uploadedBy_idx" ON "TermDocument"("uploadedBy");

-- CreateIndex
CREATE INDEX "AdminMessage_type_idx" ON "AdminMessage"("type");

-- CreateIndex
CREATE INDEX "AdminMessage_targetUserId_idx" ON "AdminMessage"("targetUserId");

-- CreateIndex
CREATE INDEX "AdminMessage_createdAt_idx" ON "AdminMessage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_userId_key" ON "AdminSession"("userId");

-- CreateIndex
CREATE INDEX "AdminSession_userId_idx" ON "AdminSession"("userId");

-- CreateIndex
CREATE INDEX "AdminSession_environment_idx" ON "AdminSession"("environment");

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AdminSession_writeEnabled_idx" ON "AdminSession"("writeEnabled");

-- CreateIndex
CREATE INDEX "AdminSession_preStartValidated_idx" ON "AdminSession"("preStartValidated");

-- CreateIndex
CREATE UNIQUE INDEX "AdminCertificate_userId_key" ON "AdminCertificate"("userId");

-- CreateIndex
CREATE INDEX "AdminCertificate_userId_idx" ON "AdminCertificate"("userId");

-- CreateIndex
CREATE INDEX "AdminCertificate_serialNumber_idx" ON "AdminCertificate"("serialNumber");

-- CreateIndex
CREATE INDEX "AdminCertificate_validUntil_idx" ON "AdminCertificate"("validUntil");

-- CreateIndex
CREATE INDEX "AdminCertificate_isActive_idx" ON "AdminCertificate"("isActive");

-- CreateIndex
CREATE INDEX "AdminOperation_userId_idx" ON "AdminOperation"("userId");

-- CreateIndex
CREATE INDEX "AdminOperation_operationType_idx" ON "AdminOperation"("operationType");

-- CreateIndex
CREATE INDEX "AdminOperation_certificateSerial_idx" ON "AdminOperation"("certificateSerial");

-- CreateIndex
CREATE INDEX "AdminOperation_createdAt_idx" ON "AdminOperation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Gallery_termDocumentId_key" ON "Gallery"("termDocumentId");

-- CreateIndex
CREATE INDEX "Gallery_ownerCpf_idx" ON "Gallery"("ownerCpf");

-- CreateIndex
CREATE INDEX "Gallery_ownerPassport_idx" ON "Gallery"("ownerPassport");

-- CreateIndex
CREATE INDEX "Gallery_sessionDate_idx" ON "Gallery"("sessionDate");

-- CreateIndex
CREATE INDEX "Photo_hash_idx" ON "Photo"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "User_passport_key" ON "User"("passport");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpToken" ADD CONSTRAINT "OtpToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermDocument" ADD CONSTRAINT "TermDocument_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminMessage" ADD CONSTRAINT "AdminMessage_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminCertificate" ADD CONSTRAINT "AdminCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminCertificate" ADD CONSTRAINT "AdminCertificate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminOperation" ADD CONSTRAINT "AdminOperation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
