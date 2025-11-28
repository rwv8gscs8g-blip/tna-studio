-- CreateEnum
CREATE TYPE "EnsaioStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ARQUITETO', 'ADMIN', 'MODELO', 'CLIENTE', 'SUPERADMIN');

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

-- CreateTable
CREATE TABLE "ArquitetoSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArquitetoSession_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gallery" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "ownerCpf" TEXT,
    "ownerPassport" TEXT,
    "sessionDate" TIMESTAMP(3),
    "syncLink" TEXT,
    "syncPassword" TEXT,
    "termDocumentId" TEXT,

    CONSTRAINT "Gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryAccess" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "granteeId" TEXT NOT NULL,
    "canDownload" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "GalleryAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageRights" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "hasUsageRights" BOOLEAN NOT NULL DEFAULT false,
    "allowedRoles" "Role"[],
    "allowedUsers" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ImageRights_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT,
    "mimeType" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "galleryId" TEXT NOT NULL,
    "isSensitive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "hash" TEXT,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
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
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TermDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ensaio" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shootDate" TIMESTAMP(3),
    "status" "EnsaioStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdById" TEXT NOT NULL,
    "subjectCpf" TEXT NOT NULL,
    "coverImageKey" TEXT,
    "termPdfKey" TEXT,
    "syncFolderUrl" TEXT,
    "d4signDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Ensaio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnsaioPhoto" (
    "id" TEXT NOT NULL,
    "ensaioId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EnsaioPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projeto" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "fullDescription" TEXT,
    "rules" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnsaioProjeto" (
    "id" TEXT NOT NULL,
    "ensaioId" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EnsaioProjeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "shortDescription" TEXT,
    "fullDescription" TEXT,
    "precoEuro" DOUBLE PRECISION,
    "categoria" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "coverImageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProdutoPhoto" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProdutoPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnsaioProduto" (
    "id" TEXT NOT NULL,
    "ensaioId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EnsaioProduto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntencaoCompra" (
    "id" TEXT NOT NULL,
    "modeloId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "IntencaoCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MODELO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "address" TEXT,
    "adminMessage" TEXT,
    "birthDate" TIMESTAMP(3),
    "city" TEXT,
    "country" TEXT,
    "cpf" TEXT,
    "gdprAccepted" BOOLEAN NOT NULL DEFAULT false,
    "lgpdAccepted" BOOLEAN NOT NULL DEFAULT false,
    "passport" TEXT,
    "personalDescription" TEXT,
    "phone" TEXT,
    "profileImage" TEXT,
    "state" TEXT,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "zipCode" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminCertificate_userId_key" ON "AdminCertificate"("userId");

-- CreateIndex
CREATE INDEX "AdminCertificate_isActive_idx" ON "AdminCertificate"("isActive");

-- CreateIndex
CREATE INDEX "AdminCertificate_serialNumber_idx" ON "AdminCertificate"("serialNumber");

-- CreateIndex
CREATE INDEX "AdminCertificate_userId_idx" ON "AdminCertificate"("userId");

-- CreateIndex
CREATE INDEX "AdminCertificate_validUntil_idx" ON "AdminCertificate"("validUntil");

-- CreateIndex
CREATE INDEX "AdminMessage_createdAt_idx" ON "AdminMessage"("createdAt");

-- CreateIndex
CREATE INDEX "AdminMessage_targetUserId_idx" ON "AdminMessage"("targetUserId");

-- CreateIndex
CREATE INDEX "AdminMessage_type_idx" ON "AdminMessage"("type");

-- CreateIndex
CREATE INDEX "AdminOperation_certificateSerial_idx" ON "AdminOperation"("certificateSerial");

-- CreateIndex
CREATE INDEX "AdminOperation_createdAt_idx" ON "AdminOperation"("createdAt");

-- CreateIndex
CREATE INDEX "AdminOperation_operationType_idx" ON "AdminOperation"("operationType");

-- CreateIndex
CREATE INDEX "AdminOperation_userId_idx" ON "AdminOperation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ArquitetoSession_sessionId_key" ON "ArquitetoSession"("sessionId");

-- CreateIndex
CREATE INDEX "ArquitetoSession_userId_idx" ON "ArquitetoSession"("userId");

-- CreateIndex
CREATE INDEX "ArquitetoSession_sessionId_idx" ON "ArquitetoSession"("sessionId");

-- CreateIndex
CREATE INDEX "ArquitetoSession_isActive_idx" ON "ArquitetoSession"("isActive");

-- CreateIndex
CREATE INDEX "ArquitetoSession_expiresAt_idx" ON "ArquitetoSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Gallery_termDocumentId_key" ON "Gallery"("termDocumentId");

-- CreateIndex
CREATE INDEX "Gallery_ownerCpf_idx" ON "Gallery"("ownerCpf");

-- CreateIndex
CREATE INDEX "Gallery_ownerPassport_idx" ON "Gallery"("ownerPassport");

-- CreateIndex
CREATE INDEX "Gallery_sessionDate_idx" ON "Gallery"("sessionDate");

-- CreateIndex
CREATE INDEX "Gallery_userId_idx" ON "Gallery"("userId");

-- CreateIndex
CREATE INDEX "Gallery_deletedAt_idx" ON "Gallery"("deletedAt");

-- CreateIndex
CREATE INDEX "GalleryAccess_granteeId_idx" ON "GalleryAccess"("granteeId");

-- CreateIndex
CREATE INDEX "GalleryAccess_deletedAt_idx" ON "GalleryAccess"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GalleryAccess_galleryId_granteeId_key" ON "GalleryAccess"("galleryId", "granteeId");

-- CreateIndex
CREATE UNIQUE INDEX "ImageRights_photoId_key" ON "ImageRights"("photoId");

-- CreateIndex
CREATE INDEX "ImageRights_ownerId_idx" ON "ImageRights"("ownerId");

-- CreateIndex
CREATE INDEX "ImageRights_deletedAt_idx" ON "ImageRights"("deletedAt");

-- CreateIndex
CREATE INDEX "OtpToken_expiresAt_idx" ON "OtpToken"("expiresAt");

-- CreateIndex
CREATE INDEX "OtpToken_phone_otp_idx" ON "OtpToken"("phone", "otp");

-- CreateIndex
CREATE INDEX "OtpToken_userId_idx" ON "OtpToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_key_key" ON "Photo"("key");

-- CreateIndex
CREATE INDEX "Photo_galleryId_idx" ON "Photo"("galleryId");

-- CreateIndex
CREATE INDEX "Photo_hash_idx" ON "Photo"("hash");

-- CreateIndex
CREATE INDEX "Photo_key_idx" ON "Photo"("key");

-- CreateIndex
CREATE INDEX "Photo_deletedAt_idx" ON "Photo"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TermDocument_galleryId_key" ON "TermDocument"("galleryId");

-- CreateIndex
CREATE INDEX "TermDocument_galleryId_idx" ON "TermDocument"("galleryId");

-- CreateIndex
CREATE INDEX "TermDocument_uploadedBy_idx" ON "TermDocument"("uploadedBy");

-- CreateIndex
CREATE INDEX "TermDocument_deletedAt_idx" ON "TermDocument"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Ensaio_slug_key" ON "Ensaio"("slug");

-- CreateIndex
CREATE INDEX "Ensaio_createdById_idx" ON "Ensaio"("createdById");

-- CreateIndex
CREATE INDEX "Ensaio_subjectCpf_idx" ON "Ensaio"("subjectCpf");

-- CreateIndex
CREATE INDEX "Ensaio_slug_idx" ON "Ensaio"("slug");

-- CreateIndex
CREATE INDEX "Ensaio_status_idx" ON "Ensaio"("status");

-- CreateIndex
CREATE INDEX "Ensaio_shootDate_idx" ON "Ensaio"("shootDate");

-- CreateIndex
CREATE INDEX "Ensaio_deletedAt_idx" ON "Ensaio"("deletedAt");

-- CreateIndex
CREATE INDEX "EnsaioPhoto_ensaioId_idx" ON "EnsaioPhoto"("ensaioId");

-- CreateIndex
CREATE INDEX "EnsaioPhoto_sortOrder_idx" ON "EnsaioPhoto"("sortOrder");

-- CreateIndex
CREATE INDEX "EnsaioPhoto_storageKey_idx" ON "EnsaioPhoto"("storageKey");

-- CreateIndex
CREATE INDEX "EnsaioPhoto_deletedAt_idx" ON "EnsaioPhoto"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Projeto_slug_key" ON "Projeto"("slug");

-- CreateIndex
CREATE INDEX "Projeto_slug_idx" ON "Projeto"("slug");

-- CreateIndex
CREATE INDEX "Projeto_active_idx" ON "Projeto"("active");

-- CreateIndex
CREATE INDEX "Projeto_deletedAt_idx" ON "Projeto"("deletedAt");

-- CreateIndex
CREATE INDEX "EnsaioProjeto_ensaioId_idx" ON "EnsaioProjeto"("ensaioId");

-- CreateIndex
CREATE INDEX "EnsaioProjeto_projetoId_idx" ON "EnsaioProjeto"("projetoId");

-- CreateIndex
CREATE INDEX "EnsaioProjeto_deletedAt_idx" ON "EnsaioProjeto"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EnsaioProjeto_ensaioId_projetoId_key" ON "EnsaioProjeto"("ensaioId", "projetoId");

-- CreateIndex
CREATE UNIQUE INDEX "Produto_slug_key" ON "Produto"("slug");

-- CreateIndex
CREATE INDEX "Produto_slug_idx" ON "Produto"("slug");

-- CreateIndex
CREATE INDEX "Produto_isActive_idx" ON "Produto"("isActive");

-- CreateIndex
CREATE INDEX "Produto_categoria_idx" ON "Produto"("categoria");

-- CreateIndex
CREATE INDEX "Produto_deletedAt_idx" ON "Produto"("deletedAt");

-- CreateIndex
CREATE INDEX "ProdutoPhoto_produtoId_idx" ON "ProdutoPhoto"("produtoId");

-- CreateIndex
CREATE INDEX "ProdutoPhoto_sortOrder_idx" ON "ProdutoPhoto"("sortOrder");

-- CreateIndex
CREATE INDEX "ProdutoPhoto_deletedAt_idx" ON "ProdutoPhoto"("deletedAt");

-- CreateIndex
CREATE INDEX "EnsaioProduto_ensaioId_idx" ON "EnsaioProduto"("ensaioId");

-- CreateIndex
CREATE INDEX "EnsaioProduto_produtoId_idx" ON "EnsaioProduto"("produtoId");

-- CreateIndex
CREATE INDEX "EnsaioProduto_deletedAt_idx" ON "EnsaioProduto"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EnsaioProduto_ensaioId_produtoId_key" ON "EnsaioProduto"("ensaioId", "produtoId");

-- CreateIndex
CREATE INDEX "IntencaoCompra_modeloId_idx" ON "IntencaoCompra"("modeloId");

-- CreateIndex
CREATE INDEX "IntencaoCompra_produtoId_idx" ON "IntencaoCompra"("produtoId");

-- CreateIndex
CREATE INDEX "IntencaoCompra_status_idx" ON "IntencaoCompra"("status");

-- CreateIndex
CREATE INDEX "IntencaoCompra_deletedAt_idx" ON "IntencaoCompra"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "User_passport_key" ON "User"("passport");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- AddForeignKey
ALTER TABLE "AdminCertificate" ADD CONSTRAINT "AdminCertificate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminCertificate" ADD CONSTRAINT "AdminCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminMessage" ADD CONSTRAINT "AdminMessage_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminOperation" ADD CONSTRAINT "AdminOperation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArquitetoSession" ADD CONSTRAINT "ArquitetoSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryAccess" ADD CONSTRAINT "GalleryAccess_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryAccess" ADD CONSTRAINT "GalleryAccess_granteeId_fkey" FOREIGN KEY ("granteeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageRights" ADD CONSTRAINT "ImageRights_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageRights" ADD CONSTRAINT "ImageRights_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpToken" ADD CONSTRAINT "OtpToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermDocument" ADD CONSTRAINT "TermDocument_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ensaio" ADD CONSTRAINT "Ensaio_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ensaio" ADD CONSTRAINT "Ensaio_subjectCpf_fkey" FOREIGN KEY ("subjectCpf") REFERENCES "User"("cpf") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnsaioPhoto" ADD CONSTRAINT "EnsaioPhoto_ensaioId_fkey" FOREIGN KEY ("ensaioId") REFERENCES "Ensaio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnsaioProjeto" ADD CONSTRAINT "EnsaioProjeto_ensaioId_fkey" FOREIGN KEY ("ensaioId") REFERENCES "Ensaio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnsaioProjeto" ADD CONSTRAINT "EnsaioProjeto_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoPhoto" ADD CONSTRAINT "ProdutoPhoto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnsaioProduto" ADD CONSTRAINT "EnsaioProduto_ensaioId_fkey" FOREIGN KEY ("ensaioId") REFERENCES "Ensaio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnsaioProduto" ADD CONSTRAINT "EnsaioProduto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntencaoCompra" ADD CONSTRAINT "IntencaoCompra_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntencaoCompra" ADD CONSTRAINT "IntencaoCompra_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
