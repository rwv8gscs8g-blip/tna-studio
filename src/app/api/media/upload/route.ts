/**
 * API de upload seguro de mídia
 * 
 * POST /api/media/upload
 * 
 * Body: FormData com:
 * - file: File
 * - galleryId: string
 * - sessionId: string (opcional)
 * - cpf: string (opcional, para naming)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";
import { generateImageKey } from "@/lib/image-naming";
import { Role } from "@prisma/client";
import { canWriteOperation } from "@/lib/write-guard-arquiteto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Configurações de upload
const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40 MB (dev)
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Rate limiting simples (em produção, usar Redis ou similar)
const uploadRateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_UPLOADS = 10; // 10 uploads por minuto

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;
  let userIp: string | undefined;

  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não encontrado na sessão" }, { status: 401 });
    }

    // Obtém IP para rate limiting e auditoria
    userIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
             req.headers.get("x-real-ip") ||
             "unknown";

    // Rate limiting por userId e IP
    const now = Date.now();
    const rateLimitKey = `${userId}:${userIp}`;
    const rateLimitData = uploadRateLimit.get(rateLimitKey);

    if (rateLimitData && rateLimitData.resetAt > now) {
      if (rateLimitData.count >= RATE_LIMIT_MAX_UPLOADS) {
        console.warn(`[Upload] Rate limit excedido: userId=${userId.substring(0, 8)}..., ip=${userIp}`);
        return NextResponse.json(
          { error: "Muitos uploads. Tente novamente em alguns instantes." },
          { status: 429 }
        );
      }
      rateLimitData.count++;
    } else {
      uploadRateLimit.set(rateLimitKey, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW,
      });
    }

    // Limpa rate limit expirado periodicamente
    if (uploadRateLimit.size > 1000) {
      for (const [key, data] of uploadRateLimit.entries()) {
        if (data.resetAt < now) {
          uploadRateLimit.delete(key);
        }
      }
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const galleryId = formData.get("galleryId") as string;
    const sessionId = formData.get("sessionId") as string || `session-${Date.now()}`;
    const cpf = formData.get("cpf") as string;

    if (!file || !galleryId) {
      return NextResponse.json(
        { error: "file e galleryId são obrigatórios" },
        { status: 400 }
      );
    }

    // Validação de tamanho
    if (file.size > MAX_FILE_SIZE) {
      console.warn(`[Upload] Arquivo muito grande: ${file.size} bytes (max: ${MAX_FILE_SIZE})`);
      return NextResponse.json(
        { error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 400 }
      );
    }

    // Validação de tipo MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      console.warn(`[Upload] Tipo MIME não permitido: ${file.type}`);
      return NextResponse.json(
        { error: `Tipo de arquivo não permitido. Tipos aceitos: ${ALLOWED_MIME_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Valida que a galeria pertence ao usuário ou é ADMIN (apenas não deletadas)
    const gallery = await prisma.gallery.findFirst({
      where: { 
        id: galleryId,
        deletedAt: null, // Apenas galerias não deletadas
      },
    });

    if (!gallery) {
      return NextResponse.json({ error: "Galeria não encontrada" }, { status: 404 });
    }

    const userRole = (session.user as any).role as Role;
    
    // Apenas ARQUITETO pode fazer upload
    // Validar com guards de escrita (apenas ARQUITETO, com Certificado A1)
    const operationId = `upload_photo_${galleryId}_${Date.now()}`;
    const userAgent = req.headers.get("user-agent") || "unknown";
    const guard = await canWriteOperation(
      userId,
      userRole,
      "upload_photo",
      operationId,
      { galleryId, fileName: file.name, fileSize: file.size },
      userIp,
      userAgent
    );

    if (!guard.allowed) {
      return NextResponse.json(
        { 
          error: guard.reason || "Operação bloqueada. Apenas ARQUITETO pode fazer upload de fotos.",
          failedLayer: guard.failedLayer,
          details: guard.details
        },
        { status: 403 }
      );
    }

    // Gera key segura
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const existingPhotos = await prisma.photo.count({
      where: { galleryId },
    });

    let key: string;
    if (cpf) {
      key = generateImageKey({
        cpf,
        sessionId,
        sequence: existingPhotos + 1,
        extension,
      });
    } else {
      // Fallback: usa ID aleatório
      key = `uploads/${galleryId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    }

    // Upload para R2
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, file.type);

    // Salva no banco
    const photo = await prisma.photo.create({
      data: {
        key,
        title: file.name,
        mimeType: file.type,
        bytes: buffer.length,
        galleryId,
        isSensitive: true,
      },
    });

    // Log de auditoria (upload bem-sucedido)
    const duration = Date.now() - startTime;
    console.log(`[Upload] Sucesso: userId=${userId?.substring(0, 8)}..., photoId=${photo.id.substring(0, 8)}..., size=${buffer.length}, ip=${userIp}, duration=${duration}ms`);

    return NextResponse.json({
      id: photo.id,
      key: photo.key,
      title: photo.title,
      bytes: photo.bytes,
      createdAt: photo.createdAt,
    });
  } catch (error: any) {
    // Log de auditoria (erro)
    const duration = Date.now() - startTime;
    console.error(`[Upload] Erro: userId=${userId?.substring(0, 8)}..., ip=${userIp}, error=${error.message}, duration=${duration}ms`);
    return NextResponse.json(
      { error: error.message || "Erro ao fazer upload" },
      { status: 500 }
    );
  }
}

