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

const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40 MB (dev)
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/webp", "image/png"];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const currentUserId = (session.user as any)?.id;
    const userRole = (session.user as any)?.role as Role;
    
    if (!currentUserId) {
      return NextResponse.json({ error: "ID do usuário não encontrado na sessão" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const targetUserId = formData.get("userId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Arquivo é obrigatório" }, { status: 400 });
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
    }

    // Verificar permissões:
    // 1. ARQUITETO pode editar qualquer foto (SUPERUSUÁRIO)
    // 2. Qualquer usuário autenticado pode editar sua própria foto
    const isArquiteto = userRole === Role.ARQUITETO;
    const isOwnPhoto = currentUserId === targetUserId;
    const canEdit = isArquiteto || isOwnPhoto;
    
    console.log(`[Upload Profile Image] Verificação: userId=${currentUserId}, targetUserId=${targetUserId}, role=${userRole}, isArquiteto=${isArquiteto}, isOwnPhoto=${isOwnPhoto}, canEdit=${canEdit}`);
    
    if (!canEdit) {
      console.warn(`[Upload Profile Image] Acesso negado: userId=${currentUserId}, targetUserId=${targetUserId}, role=${userRole}`);
      return NextResponse.json(
        { 
          error: "Acesso negado. Você só pode editar sua própria foto de perfil, ou precisa ser ARQUITETO para editar outras fotos.",
          reason: "permission_denied",
          currentUserId,
          targetUserId,
          userRole,
        },
        { status: 403 }
      );
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
    const key = `profile-images/${targetUserId}-${timestamp}.${extension}`;

    // Upload para R2
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, file.type);

    // Gerar URL assinada (válida por 1 hora para preview imediato)
    const signedUrl = await getSignedUrlForKey(key, { expiresInSeconds: 3600 }); // 1 hora

    return NextResponse.json({ 
      key, // storageKey para salvar no banco
      url: signedUrl, // URL assinada para preview imediato
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

