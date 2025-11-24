import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: Listar todas as solicitações (apenas ARQUITETO)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userRole = (session.user as any)?.role as Role;
    
    // Apenas ARQUITETO pode ver todas as solicitações
    if (userRole !== "ARQUITETO") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const status = req.nextUrl.searchParams.get("status") || "PENDING";

    const requests = await prisma.modelChangeRequest.findMany({
      where: status === "ALL" ? {} : { status },
      orderBy: { createdAt: "desc" },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        Aprovador: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error("Erro ao listar solicitações:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao listar solicitações" },
      { status: 500 }
    );
  }
}

