/**
 * API de Upload de Certificado A1 para SUPER_ADMIN
 * 
 * POST /api/super-admin/certificates/upload
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { validateCertificateFile } from "@/lib/certificate-a1-production";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role as Role;

    // Apenas SUPER_ADMIN pode fazer upload de certificados
    if (userRole !== Role.SUPERADMIN) {
      return NextResponse.json(
        { error: "Apenas SUPER_ADMIN pode gerenciar certificados A1" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const certificateFile = formData.get("certificate") as File;
    const password = formData.get("password") as string;

    if (!certificateFile) {
      return NextResponse.json({ error: "Arquivo de certificado não fornecido" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "Senha do certificado não fornecida" }, { status: 400 });
    }

    // Validar tipo de arquivo
    const fileName = certificateFile.name.toLowerCase();
    if (!fileName.endsWith(".pfx") && !fileName.endsWith(".p12")) {
      return NextResponse.json(
        { error: "Arquivo deve ser .pfx ou .p12" },
        { status: 400 }
      );
    }

    // Converter File para Buffer
    const arrayBuffer = await certificateFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Salvar certificado temporariamente
    const certDir = join(process.cwd(), "secrets", "certs");
    mkdirSync(certDir, { recursive: true });
    const tempPath = join(certDir, "temp_upload.pfx");
    writeFileSync(tempPath, buffer);

    try {
      // Validar certificado usando a função de validação de arquivo
      const validation = await validateCertificateFile(tempPath, password);

      if (!validation.valid || !validation.certificate) {
        return NextResponse.json(
          { error: `Certificado inválido: ${validation.issues.join(", ")}` },
          { status: 400 }
        );
      }

      // Se validação passou, substituir certificado atual
      const finalPath = join(certDir, "assinatura_a1.pfx");
      writeFileSync(finalPath, buffer);

      // Calcular hash do certificado para armazenar
      const { createHash } = await import("crypto");
      const certificateHash = createHash("sha256").update(buffer).digest("hex");
      const signatureHash = createHash("sha256").update(certificateHash + validation.certificate.serial + validation.certificate.thumbprint).digest("hex");

      // Registrar certificado no banco (AdminCertificate)
      const certData = validation.certificate;
      await prisma.adminCertificate.upsert({
        where: { userId },
        update: {
          certificateHash,
          certificateEncrypted: buffer.toString("base64"), // Em produção, criptografar
          serialNumber: certData.serial,
          issuer: certData.issuerCN || certData.issuerO || "Unknown",
          validFrom: new Date(certData.notBefore),
          validUntil: new Date(certData.notAfter),
          isActive: true,
          lastUsedAt: new Date(),
          createdBy: userId,
        },
        create: {
          userId,
          certificateHash,
          certificateEncrypted: buffer.toString("base64"), // Em produção, criptografar
          serialNumber: certData.serial,
          issuer: certData.issuerCN || certData.issuerO || "Unknown",
          validFrom: new Date(certData.notBefore),
          validUntil: new Date(certData.notAfter),
          isActive: true,
          lastUsedAt: new Date(),
          createdBy: userId,
        },
      });

      return NextResponse.json({
        ok: true,
        message: "Certificado A1 adicionado com sucesso",
        certificate: {
          subject: certData.subjectCN,
          issuer: certData.issuerCN || certData.issuerO || "Unknown",
          serial: certData.serial,
          validFrom: certData.notBefore,
          validUntil: certData.notAfter,
        },
      });
    } finally {
      // Remover arquivo temporário
      try {
        const fs = require("fs");
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch (e) {
        // Ignorar erro ao remover temp
      }
    }
  } catch (error: any) {
    console.error("Erro ao fazer upload de certificado:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao fazer upload de certificado" },
      { status: 500 }
    );
  }
}

