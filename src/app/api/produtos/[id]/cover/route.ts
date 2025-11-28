/**
 * GET /api/produtos/[id]/cover
 * Retorna URL assinada efêmera para a foto de capa do produto
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSignedUrlForKey } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id } = await params;

    const produto = await prisma.produto.findUnique({
      where: { id },
      select: { 
        coverImageKey: true,
        photos: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { storageKey: true },
        },
      },
    });

    if (!produto) {
      return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    }

    // Usar coverImageKey se existir, senão usar primeira foto
    const imageKey = produto.coverImageKey || produto.photos[0]?.storageKey;

    if (!imageKey) {
      return NextResponse.json({ error: "Foto de capa não encontrada." }, { status: 404 });
    }

    try {
      const signedUrl = await getSignedUrlForKey(imageKey, { expiresInSeconds: 120 });

      return NextResponse.json(
        { signedUrl },
        {
          headers: {
            "Cache-Control": "no-store, private",
          },
        }
      );
    } catch (error: any) {
      console.error("[API] Erro ao gerar URL assinada para cover:", error);
      return NextResponse.json(
        { error: "Erro ao gerar URL assinada." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[API] Erro ao buscar cover do produto:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar foto de capa." },
      { status: 500 }
    );
  }
}

