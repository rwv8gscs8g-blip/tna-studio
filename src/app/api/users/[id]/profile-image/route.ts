/**
 * GET /api/users/[id]/profile-image
 * 
 * Retorna URL assinada efêmera para a foto de perfil do usuário.
 * 
 * SEGURANÇA:
 * - Valida autenticação via NextAuth
 * - ARQUITETO/ADMIN: podem ver todas as fotos de perfil
 * - MODELO/CLIENTE: podem ver apenas a própria foto
 * - URL assinada com expiração curta (60-120s)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSignedUrlForKey } from "@/lib/r2";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role as Role;
    const userId = (session.user as any)?.id;
    const { id } = await params;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        profileImage: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    // Verificar permissões
    // ARQUITETO e ADMIN podem ver todas as fotos
    // Outros podem ver apenas a própria foto
    if (userRole !== Role.ARQUITETO && userRole !== Role.ADMIN && userId !== id) {
      return NextResponse.json(
        { error: "Acesso negado." },
        { status: 403 }
      );
    }

    if (!user.profileImage) {
      return NextResponse.json(
        { error: "Foto de perfil não encontrada." },
        { status: 404 }
      );
    }

    // Se profileImage já é uma URL completa, retornar diretamente
    if (user.profileImage.startsWith("http")) {
      return NextResponse.json(
        { signedUrl: user.profileImage },
        {
          headers: {
            "Cache-Control": "no-store, private",
          },
        }
      );
    }

    // Caso contrário, tratar como storageKey e gerar URL assinada
    try {
      const signedUrl = await getSignedUrlForKey(user.profileImage, { expiresInSeconds: 120 });
      
      return NextResponse.json(
        { signedUrl },
        {
          headers: {
            "Cache-Control": "no-store, private",
          },
        }
      );
    } catch (error: any) {
      console.error("[API] Erro ao gerar URL assinada para foto de perfil:", error);
      return NextResponse.json(
        { error: "Erro ao gerar URL assinada." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[API] Erro ao buscar foto de perfil:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar foto de perfil." },
      { status: 500 }
    );
  }
}

