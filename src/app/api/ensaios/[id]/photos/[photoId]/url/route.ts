/**
 * GET /api/ensaios/[id]/photos/[photoId]/url
 * Obter URL assinada de uma foto específica do ensaio
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
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id, photoId } = await params;
    const userRole = (session.user as any)?.role as Role;
    const userId = (session.user as any)?.id;

    // Buscar foto
    const photo = await prisma.ensaioPhoto.findFirst({
      where: {
        id: photoId,
        ensaioId: id,
        deletedAt: null,
      },
      include: {
        ensaio: {
          select: {
            id: true,
            createdById: true,
            subjectCpf: true,
            subject: {
              select: {
                id: true,
                cpf: true,
              },
            },
          },
        },
      },
    });

    if (!photo) {
      return NextResponse.json({ error: "Foto não encontrada" }, { status: 404 });
    }

    // Verificar permissão
    // ARQUITETO/ADMIN: acesso total
    // MODELO/CLIENTE: apenas se o ensaio for deles (subjectCpf === user.cpf)
    if (userRole === Role.ARQUITETO || userRole === Role.ADMIN || userRole === Role.SUPERADMIN) {
      // Acesso permitido
    } else if (userRole === Role.MODELO || userRole === Role.CLIENTE) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { cpf: true },
      });
      if (!user?.cpf || user.cpf !== photo.ensaio.subjectCpf) {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Gerar URL assinada (válida por 1 hora para fotos de ensaio)
    const signedUrl = await getSignedUrlForKey(photo.storageKey, { expiresInSeconds: 3600 });

    return NextResponse.json({ url: signedUrl });
  } catch (error: any) {
    console.error("[API] Erro ao buscar URL da foto:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar URL da foto" },
      { status: 500 }
    );
  }
}

