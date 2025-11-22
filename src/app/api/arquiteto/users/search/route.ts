/**
 * API para buscar usuários por nome, email ou CPF
 * Usado em formulários de criação de ensaio e outros lugares
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userRole = (session.user as any)?.role as Role;
    
    // Apenas ARQUITETO e ADMIN podem buscar usuários
    if (userRole !== Role.ARQUITETO && userRole !== Role.ADMIN) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const roleFilter = searchParams.get("role"); // Opcional: filtrar por role (MODELO, CLIENTE)

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Normalizar query (remover caracteres especiais do CPF)
    const normalizedQuery = query.replace(/\D/g, "");
    const isCpfSearch = normalizedQuery.length >= 3 && normalizedQuery.length <= 11;

    // Construir condições de busca
    const where: any = {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    };

    // Se parece CPF, buscar também por CPF
    if (isCpfSearch) {
      where.OR.push({ cpf: { contains: normalizedQuery } });
    }

    // Filtrar por role se especificado
    if (roleFilter && (roleFilter === "MODELO" || roleFilter === "CLIENTE")) {
      where.role = roleFilter;
    }

    // Buscar usuários (apenas MODELO e CLIENTE, pois são os que podem ser associados a ensaios)
    const users = await prisma.user.findMany({
      where: {
        ...where,
        role: { in: [Role.MODELO, Role.CLIENTE] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        role: true,
      },
      take: 20, // Limitar a 20 resultados
      orderBy: [
        { name: "asc" },
        { email: "asc" },
      ],
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("[API] Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}

