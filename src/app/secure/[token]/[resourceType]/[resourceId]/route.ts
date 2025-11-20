/**
 * Rota segura que valida token e redireciona para recurso
 * 
 * GET /secure/[token]/[resourceType]/[resourceId]
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateSessionToken } from "@/lib/session-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; resourceType: string; resourceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }

    const { token, resourceType, resourceId } = await params;

    // Valida token com logs detalhados
    console.log(`[SecureRoute] Tentativa de acesso: token=${token.substring(0, 16)}..., userId=${userId.substring(0, 8)}..., resource=${resourceType}/${resourceId}`);
    
    if (!validateSessionToken(token, userId)) {
      console.error(`[SecureRoute] ACESSO NEGADO: token inválido ou expirado para userId=${userId.substring(0, 8)}...`);
      return NextResponse.json(
        { error: "Token inválido ou expirado. Acesso negado." },
        { status: 403 }
      );
    }

    console.log(`[SecureRoute] ACESSO PERMITIDO: redirecionando para ${resourceType}/${resourceId}`);

    // Redireciona para o recurso correto
    if (resourceType === "gallery") {
      return NextResponse.redirect(new URL(`/galleries/${resourceId}`, req.url));
    } else if (resourceType === "photo") {
      // Para fotos, redireciona para a galeria que contém a foto
      // (precisaríamos buscar no banco, mas por enquanto redireciona para galerias)
      return NextResponse.redirect(new URL("/galleries", req.url));
    }

    return NextResponse.json({ error: "Tipo de recurso inválido" }, { status: 400 });
  } catch (error: any) {
    console.error("Erro na rota segura:", error);
    return NextResponse.redirect(new URL("/signin", req.url));
  }
}

