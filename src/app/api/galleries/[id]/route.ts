/**
 * API de detalhes de galeria
 * 
 * GET /api/galleries/[id] - Detalhes da galeria
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessGallery } from "@/lib/image-rights";
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
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não encontrado na sessão" }, { status: 401 });
    }

    const { id } = await params;
    const userRole = (session.user as any).role as Role;

    // Valida acesso
    const accessCheck = await canAccessGallery(userId, userRole, id);
    if (!accessCheck.allowed) {
      return NextResponse.json({ error: accessCheck.reason || "Acesso negado" }, { status: 403 });
    }

    const gallery = await prisma.gallery.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        photos: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            key: true,
            title: true,
            mimeType: true,
            bytes: true,
            isSensitive: true,
            createdAt: true,
          },
        },
        _count: {
          select: { photos: true },
        },
      },
    });

    if (!gallery) {
      return NextResponse.json({ error: "Galeria não encontrada" }, { status: 404 });
    }

    return NextResponse.json(gallery);
  } catch (error: any) {
    console.error("Erro ao buscar galeria:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar galeria" },
      { status: 500 }
    );
  }
}

