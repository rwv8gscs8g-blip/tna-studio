import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/arquiteto/users/search-by-cpf?cpf=...
 * Busca usuário por CPF (apenas ARQUITETO)
 * Retorna apenas usuários com role MODELO ou CLIENTE
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role as Role;
    
    // Apenas ARQUITETO pode buscar usuários
    if (userRole !== Role.ARQUITETO) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas ARQUITETO pode buscar usuários." },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const cpf = searchParams.get("cpf");

    if (!cpf || typeof cpf !== "string") {
      return NextResponse.json(
        { error: "CPF é obrigatório." },
        { status: 400 }
      );
    }

    // Normalizar CPF (remover pontos/traços)
    const normalizedCpf = cpf.replace(/\D/g, "");

    if (normalizedCpf.length < 3) {
      // Mínimo de 3 dígitos para buscar
      return NextResponse.json({ users: [] });
    }

    // Buscar usuários que começam com o CPF normalizado
    // Apenas MODELO ou CLIENTE
    const users = await prisma.user.findMany({
      where: {
        cpf: {
          startsWith: normalizedCpf,
        },
        role: {
          in: [Role.MODELO, Role.CLIENTE],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        role: true,
      },
      take: 10, // Limitar a 10 resultados
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("[API] Erro ao buscar usuário por CPF:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar usuário." },
      { status: 500 }
    );
  }
}

