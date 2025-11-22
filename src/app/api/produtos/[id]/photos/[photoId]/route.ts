/**
 * GET /api/produtos/[id]/photos/[photoId]
 * Retorna URL assinada efêmera para uma foto do produto
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSignedUrlForKey } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id, photoId } = await params;

    const photo = await prisma.produtoPhoto.findFirst({
      where: {
        id: photoId,
        produtoId: id,
      },
      select: { storageKey: true },
    });

    if (!photo) {
      return NextResponse.json({ error: "Foto não encontrada." }, { status: 404 });
    }

    try {
      const signedUrl = await getSignedUrlForKey(photo.storageKey, { expiresInSeconds: 120 });

      return NextResponse.json(
        { signedUrl },
        {
          headers: {
            "Cache-Control": "no-store, private",
          },
        }
      );
    } catch (error: any) {
      console.error("[API] Erro ao gerar URL assinada para foto:", error);
      return NextResponse.json(
        { error: "Erro ao gerar URL assinada." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[API] Erro ao buscar foto do produto:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar foto." },
      { status: 500 }
    );
  }
}

