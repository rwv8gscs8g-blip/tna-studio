/**
 * API para deletar foto de produto
 * DELETE: Remove foto de produto (soft delete)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userRole = (session.user as any)?.role as Role;
    if (userRole !== Role.ARQUITETO) {
      return NextResponse.json({ error: "Acesso negado. Apenas ARQUITETO pode excluir fotos." }, { status: 403 });
    }

    const { id: produtoId, photoId } = await params;

    // Verificar se a foto pertence ao produto
    const photo = await prisma.produtoPhoto.findFirst({
      where: {
        id: photoId,
        produtoId,
        deletedAt: null,
      },
    });

    if (!photo) {
      return NextResponse.json({ error: "Foto não encontrada" }, { status: 404 });
    }

    // Soft delete
    await prisma.produtoPhoto.update({
      where: { id: photoId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Foto excluída com sucesso" }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Erro ao excluir foto:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao excluir foto" },
      { status: 500 }
    );
  }
}

