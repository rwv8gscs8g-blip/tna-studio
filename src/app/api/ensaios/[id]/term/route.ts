/**
 * GET /api/ensaios/[id]/term
 * 
 * Retorna URL assinada efêmera para o PDF do termo de autorização.
 * 
 * SEGURANÇA:
 * - Valida autenticação via NextAuth
 * - ARQUITETO/ADMIN: podem ver todos os ensaios
 * - MODELO: só pode ver seus próprios ensaios PUBLICADOS
 * - URL assinada com expiração curta (60-120s)
 * - Header Content-Disposition para download quando necessário
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSignedUrlForKey } from "@/lib/r2";
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
    const userCpf = (session.user as any)?.cpf as string | null;

    const { id } = await params;

    // Buscar ensaio
    const ensaio = await prisma.ensaio.findUnique({
      where: { id },
    });

    if (!ensaio) {
      return NextResponse.json(
        { error: "Ensaio não encontrado." },
        { status: 404 }
      );
    }

    // Verificar permissões
    if (userRole === Role.ARQUITETO || userRole === Role.ADMIN) {
      if (userRole === Role.ARQUITETO && ensaio.createdById !== userId) {
        return NextResponse.json(
          { error: "Acesso negado." },
          { status: 403 }
        );
      }
    } else if (userRole === Role.MODELO) {
      if (!userCpf || ensaio.subjectCpf !== userCpf || ensaio.status !== "PUBLISHED") {
        return NextResponse.json(
          { error: "Acesso negado." },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Acesso negado." },
        { status: 403 }
      );
    }

    // Gerar URL assinada para PDF do termo
    const termPdfKey = (ensaio as any).termPdfKey || (ensaio as any).termPdfUrl;
    
    if (!termPdfKey) {
      return NextResponse.json(
        { error: "PDF do termo não encontrado." },
        { status: 404 }
      );
    }

    try {
      const signedUrl = await getSignedUrlForKey(termPdfKey, { expiresInSeconds: 120 });
      
      return NextResponse.json(
        { signedUrl },
        {
          headers: {
            "Cache-Control": "no-store, private",
          },
        }
      );
    } catch (error: any) {
      console.error("[API] Erro ao gerar URL assinada para term PDF:", error);
      return NextResponse.json(
        { error: "Erro ao gerar URL assinada." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[API] Erro ao buscar term PDF do ensaio:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar PDF do termo." },
      { status: 500 }
    );
  }
}

