/**
 * GET /api/ensaios/[id]/sync-link
 * 
 * Retorna o link do Sync.com para o ensaio (MUITO SENSÍVEL).
 * 
 * SEGURANÇA:
 * - Apenas ARQUITETO e ADMIN podem acessar
 * - Valida autenticação via NextAuth
 * - ARQUITETO: só pode ver seus próprios ensaios
 * - ADMIN: pode ver todos (só leitura)
 * - MODELO/CLIENTE: SEM ACESSO (não exposto para eles)
 * 
 * IMPORTANTE: Este link é muito sensível, não deve ser exposto para MODELO no MVP.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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

    // Apenas ARQUITETO e ADMIN podem acessar sync link
    if (userRole !== Role.ARQUITETO && userRole !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas ARQUITETO e ADMIN podem acessar o link de sincronização." },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Buscar ensaio
    const ensaio = await prisma.ensaio.findUnique({
      where: { id },
      select: {
        id: true,
        createdById: true,
        syncFolderUrl: true,
      },
    });

    if (!ensaio) {
      return NextResponse.json(
        { error: "Ensaio não encontrado." },
        { status: 404 }
      );
    }

    // ARQUITETO: só pode ver seus próprios ensaios
    if (userRole === Role.ARQUITETO && ensaio.createdById !== userId) {
      return NextResponse.json(
        { error: "Acesso negado. Você só pode ver o link de sincronização dos seus próprios ensaios." },
        { status: 403 }
      );
    }

    if (!ensaio.syncFolderUrl) {
      return NextResponse.json(
        { error: "Link de sincronização não configurado para este ensaio." },
        { status: 404 }
      );
    }

    // Retornar URL (ou fazer redirect 302 se preferir)
    return NextResponse.json(
      { syncUrl: ensaio.syncFolderUrl },
      {
        headers: {
          "Cache-Control": "no-store, private",
        },
      }
    );
  } catch (error: any) {
    console.error("[API] Erro ao buscar sync link do ensaio:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar link de sincronização." },
      { status: 500 }
    );
  }
}

