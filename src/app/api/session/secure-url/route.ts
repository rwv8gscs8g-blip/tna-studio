/**
 * API para gerar URLs efêmeras seguras
 * 
 * POST /api/session/secure-url
 * Body: { resourceType: "gallery" | "photo", resourceId: string }
 * 
 * Retorna: { secureUrl: string, expiresIn: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateSessionToken } from "@/lib/session-tokens";

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

    const body = await req.json();
    const { resourceType, resourceId } = body;

    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { error: "resourceType e resourceId são obrigatórios" },
        { status: 400 }
      );
    }

    // Gera token efêmero
    const token = generateSessionToken(userId);

    // Gera URL segura
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const secureUrl = `${baseUrl}/secure/${token}/${resourceType}/${resourceId}`;

    return NextResponse.json({
      secureUrl,
      expiresIn: 300, // 5 minutos
    });
  } catch (error: any) {
    console.error("Erro ao gerar URL segura:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar URL segura" },
      { status: 500 }
    );
  }
}

