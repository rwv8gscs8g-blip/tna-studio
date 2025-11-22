/**
 * API de Projetos
 * GET: Lista projetos (ativos ou todos)
 * POST: Cria projeto (apenas ARQUITETO)
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

    const searchParams = req.nextUrl.searchParams;
    const activeOnly = searchParams.get("active") === "true";

    const projetos = await prisma.projeto.findMany({
      where: activeOnly ? { active: true } : undefined,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        active: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ projetos }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Erro ao listar projetos:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao listar projetos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userRole = (session.user as any)?.role as Role;
    if (userRole !== Role.ARQUITETO) {
      return NextResponse.json({ error: "Acesso negado. Apenas ARQUITETO pode criar projetos." }, { status: 403 });
    }

    const { name, description, active = true } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    // Gerar slug
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    const projeto = await prisma.projeto.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        active: active === true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ projeto }, { status: 201 });
  } catch (error: any) {
    console.error("[API] Erro ao criar projeto:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar projeto" },
      { status: 500 }
    );
  }
}
