import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { deleteFromR2 } from "@/lib/r2";
import { logAction } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/arquiteto/ensaios/limpar-deletados
 * Limpar ensaios deletados há mais de 7 dias (apenas ARQUITETO)
 */
export async function POST(req: NextRequest) {
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
        { error: "Acesso negado. Apenas ARQUITETO pode limpar ensaios deletados." },
        { status: 403 }
      );
    }

    const userId = (session.user as any)?.id;

    // Calcular data de 7 dias atrás
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    // Buscar ensaios deletados há mais de 7 dias (soft delete via deletedAt)
    const ensaiosDeletados = await prisma.ensaio.findMany({
      where: {
        createdById: userId,
        deletedAt: {
          not: null, // Tem deletedAt
          lte: seteDiasAtras, // Deletado há mais de 7 dias
        },
      },
      include: {
        photos: {
          where: { deletedAt: null }, // Apenas fotos não deletadas ainda
        },
      },
    });

    if (ensaiosDeletados.length === 0) {
      return NextResponse.json({
        message: "Nenhum ensaio deletado há mais de 7 dias encontrado.",
        deleted: 0,
      });
    }

    // Deletar fotos do R2 e depois do banco
    let fotosDeletadas = 0;
    for (const ensaio of ensaiosDeletados) {
      for (const photo of ensaio.photos) {
        try {
          await deleteFromR2(photo.storageKey);
          fotosDeletadas++;
        } catch (err) {
          console.error(`[Limpeza] Erro ao deletar foto ${photo.id} do R2:`, err);
        }
      }

      // Deletar capa e termo do R2 se existirem
      if (ensaio.coverImageKey) {
        try {
          await deleteFromR2(ensaio.coverImageKey);
        } catch (err) {
          console.error(`[Limpeza] Erro ao deletar capa do ensaio ${ensaio.id}:`, err);
        }
      }

      if (ensaio.termPdfKey) {
        try {
          await deleteFromR2(ensaio.termPdfKey);
        } catch (err) {
          console.error(`[Limpeza] Erro ao deletar termo do ensaio ${ensaio.id}:`, err);
        }
      }
    }

    // Deletar registros do banco (cascade vai deletar fotos automaticamente)
    const { count } = await prisma.ensaio.deleteMany({
      where: {
        id: {
          in: ensaiosDeletados.map((e) => e.id),
        },
      },
    });

    // Registrar em AuditLog
    try {
      await logAction({
        actorId: userId,
        action: "CLEANUP_DELETED_ENSAIOS",
        entity: "Ensaio",
        entityId: `batch_${ensaiosDeletados.length}`,
        metadata: {
          count: count,
          fotosDeletadas,
          ensaiosIds: ensaiosDeletados.map((e) => e.id),
        },
      });
    } catch (auditError) {
      console.error("[API] Erro ao registrar auditoria:", auditError);
    }

    return NextResponse.json({
      message: `${count} ensaio(s) deletado(s) permanentemente. ${fotosDeletadas} foto(s) removida(s) do R2.`,
      deleted: count,
      fotosDeletadas,
    });
  } catch (error: any) {
    console.error("[API] Erro ao limpar ensaios deletados:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao limpar ensaios deletados." },
      { status: 500 }
    );
  }
}

