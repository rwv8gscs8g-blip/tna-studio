/**
 * API para upload de arquivos de ensaio (capa, termo PDF, fotos)
 * Apenas ARQUITETO pode fazer upload
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/webp", "image/png"];
const ALLOWED_PDF_TYPES = ["application/pdf"];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userRole = (session.user as any)?.role as Role;
    
    // Apenas ARQUITETO pode fazer upload
    if (userRole !== Role.ARQUITETO) {
      return NextResponse.json({ error: "Acesso negado. Apenas ARQUITETO pode fazer upload." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string; // "cover", "term", "photo"
    const ensaioId = formData.get("ensaioId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Arquivo é obrigatório" }, { status: 400 });
    }

    if (!type || !["cover", "term", "photo"].includes(type)) {
      return NextResponse.json({ error: "Tipo inválido. Use: cover, term ou photo" }, { status: 400 });
    }

    // Validação de tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 400 }
      );
    }

    // Validação de tipo
    if (type === "photo" || type === "cover") {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Tipo de imagem não permitido. Use: JPEG, WebP ou PNG. Recomendado: WebP com resolução 2048px lado maior, qualidade 80.` },
          { status: 400 }
        );
      }
    } else if (type === "term") {
      if (!ALLOWED_PDF_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Tipo de arquivo não permitido. Use PDF." },
          { status: 400 }
        );
      }
    }

    // Gerar chave R2
    const timestamp = Date.now();
    const extension = type === "term" ? "pdf" : file.name.split(".").pop()?.toLowerCase() || "jpg";
    const key = ensaioId 
      ? `ensaio-${ensaioId}/${type}-${timestamp}.${extension}`
      : `temp/${type}-${timestamp}.${extension}`;

    // Upload para R2
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, file.type);

    return NextResponse.json({ 
      key,
      size: file.size,
      type: file.type,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[API] Erro ao fazer upload:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao fazer upload" },
      { status: 500 }
    );
  }
}

