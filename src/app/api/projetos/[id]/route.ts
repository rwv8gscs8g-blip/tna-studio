/**
 * API de Projeto individual
 * GET: Busca projeto por ID
 * PATCH: Atualiza projeto (apenas ARQUITETO)
 * DELETE: Remove projeto (apenas ARQUITETO)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { logDeleteAction } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;

    const projeto = await prisma.projeto.findUnique({
      where: { 
        id,
        deletedAt: null, // Apenas projetos não deletados
      },
      include: {
        _count: {
          select: {
            ensaios: true,
          },
        },
      },
    });

    if (!projeto) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ projeto }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Erro ao buscar projeto:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar projeto" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userRole = (session.user as any)?.role as Role;
    if (userRole !== Role.ARQUITETO) {
      return NextResponse.json({ error: "Acesso negado. Apenas ARQUITETO pode editar projetos." }, { status: 403 });
    }

    const { id } = await params;
    const data = await req.json();

    const projeto = await prisma.projeto.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.active !== undefined && { active: data.active === true }),
      },
    });

    return NextResponse.json({ projeto }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Erro ao atualizar projeto:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar projeto" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userRole = (session.user as any)?.role as Role;
    if (userRole !== Role.ARQUITETO) {
      return NextResponse.json({ error: "Acesso negado. Apenas ARQUITETO pode excluir projetos." }, { status: 403 });
    }

    const { id } = await params;
    const userId = (session.user as any)?.id;

    // Soft delete
    await prisma.projeto.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Registrar auditoria
    await logDeleteAction(userId, "Projeto", id, {
      name: (await prisma.projeto.findUnique({ where: { id }, select: { name: true } }))?.name,
    });

    return NextResponse.json({ message: "Projeto excluído com sucesso" }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Erro ao excluir projeto:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao excluir projeto" },
      { status: 500 }
    );
  }
}
