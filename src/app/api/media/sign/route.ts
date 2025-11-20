/**
 * API para gerar URLs assinadas temporárias
 * 
 * GET /api/media/sign?photoId={id}&expiresIn={seconds}
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSecurePhotoUrl } from "@/lib/r2-secure";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não encontrado na sessão" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const photoId = searchParams.get("photoId");
    const expiresIn = parseInt(searchParams.get("expiresIn") || "3600", 10);

    if (!photoId) {
      return NextResponse.json({ error: "photoId é obrigatório" }, { status: 400 });
    }

    const userRole = (session.user as any).role as Role;
    const result = await getSecurePhotoUrl(photoId, userId, userRole, expiresIn);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ url: result.url, expiresIn });
  } catch (error: any) {
    console.error("Erro ao gerar signed URL:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar URL" },
      { status: 500 }
    );
  }
}

