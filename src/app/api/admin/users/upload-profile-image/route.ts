/**
 * API para upload de foto de perfil de usuário
 * Apenas ARQUITETO pode fazer upload
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToR2 } from "@/lib/r2";
import { getSignedUrlForKey } from "@/lib/r2";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/webp", "image/png"];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userRole = (session.user as any)?.role as Role;
    
    // Apenas ARQUITETO pode fazer upload de foto de perfil
    if (userRole !== Role.ARQUITETO) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas ARQUITETO pode fazer upload de foto de perfil." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Arquivo é obrigatório" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
    }

    // Validação de tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 400 }
      );
    }

    // Validação de tipo
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de imagem não permitido. Use: JPEG, WebP ou PNG.` },
        { status: 400 }
      );
    }

    // Gerar chave R2
    const timestamp = Date.now();
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const key = `profile-images/${userId}-${timestamp}.${extension}`;

    // Upload para R2
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, file.type);

    // Gerar URL assinada (válida por 1 ano para fotos de perfil)
    const signedUrl = await getSignedUrlForKey(key, { expiresInSeconds: 31536000 }); // 1 ano

    return NextResponse.json({ 
      key,
      url: signedUrl,
      size: file.size,
      type: file.type,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[API] Erro ao fazer upload de foto de perfil:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao fazer upload de foto de perfil" },
      { status: 500 }
    );
  }
}

