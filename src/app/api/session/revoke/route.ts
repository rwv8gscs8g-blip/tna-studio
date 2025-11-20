/**
 * API para revogar tokens de sessão
 * 
 * POST /api/session/revoke
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { revokeAllUserTokens } from "@/lib/session-tokens";

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

    // Revoga todos os tokens do usuário
    revokeAllUserTokens(userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao revogar tokens:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao revogar tokens" },
      { status: 500 }
    );
  }
}

