/**
 * API para estender sessão em 5 minutos
 * 
 * POST /api/session/extend
 * 
 * Estende a sessão atual em 5 minutos (300 segundos)
 * 
 * NOTA: Esta API não pode realmente estender o token JWT existente.
 * O que faz é forçar o NextAuth a atualizar a sessão, o que pode
 * gerar um novo token se o trigger for usado corretamente.
 * 
 * A extensão real deve ser feita no callback jwt quando trigger === "update"
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não encontrado na sessão" }, { status: 401 });
    }

    // Verifica se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // A extensão real será feita no callback jwt quando update() for chamado
    // Este endpoint apenas valida que o usuário está autenticado
    console.log(`[SessionExtend] Solicitação de extensão para userId=${userId.substring(0, 8)}...`);

    return NextResponse.json({ 
      success: true, 
      message: "Sessão será estendida. Atualize a sessão no cliente.",
      expiresIn: 300,
    });
  } catch (error: any) {
    console.error("[SessionExtend] Erro ao estender sessão:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao estender sessão" },
      { status: 500 }
    );
  }
}

