import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isArquitetoSessionReadOnly } from "@/lib/arquiteto-session";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DELETE /api/arquiteto/ensaios/[id]/photos/[photoId]
 * Remover foto do ensaio (apenas ARQUITETO)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
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
    if (userRole !== Role.ARQUITETO) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas ARQUITETO pode remover fotos." },
        { status: 403 }
      );
    }

    const userId = (session.user as any)?.id;
    
    // Verificar se está em modo somente leitura
    const sessionId = (session as any)?.arquitetoSessionId;
    if (sessionId) {
      const isReadOnly = await isArquitetoSessionReadOnly(userId, sessionId);
      if (isReadOnly) {
        return NextResponse.json(
          { error: "Sessão em modo somente leitura. Existe outra sessão ativa mais recente. Faça login novamente para retomar os poderes de edição." },
          { status: 403 }
        );
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário não encontrado." },
        { status: 400 }
      );
    }

    const { id, photoId } = await params;

    // Verificar se a foto existe e pertence a um ensaio do ARQUITETO
    const photo = await prisma.ensaioPhoto.findUnique({
      where: { id: photoId },
      include: {
        ensaio: {
          select: {
            id: true,
            createdById: true,
          },
        },
      },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Foto não encontrada." },
        { status: 404 }
      );
    }

    if (photo.ensaioId !== id) {
      return NextResponse.json(
        { error: "Foto não pertence a este ensaio." },
        { status: 400 }
      );
    }

    if (photo.ensaio.createdById !== userId) {
      return NextResponse.json(
        { error: "Acesso negado. Você só pode remover fotos dos seus próprios ensaios." },
        { status: 403 }
      );
    }

    // Remover foto
    await prisma.ensaioPhoto.delete({
      where: { id: photoId },
    });

    return NextResponse.json(
      { message: "Foto removida com sucesso." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API] Erro ao remover foto:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao remover foto." },
      { status: 500 }
    );
  }
}

