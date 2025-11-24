/**
 * API de Produto individual
 * GET: Busca produto por ID
 * PATCH: Atualiza produto (apenas ARQUITETO)
 * DELETE: Remove produto (apenas ARQUITETO)
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

    const produto = await prisma.produto.findUnique({
      where: { 
        id,
        deletedAt: null, // Apenas produtos não deletados
      },
      include: {
        photos: {
          where: { deletedAt: null }, // Apenas fotos não deletadas
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: {
            ensaios: true,
            intencoes: true,
          },
        },
      },
    });

    if (!produto) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ produto }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Erro ao buscar produto:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar produto" },
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
      return NextResponse.json({ error: "Acesso negado. Apenas ARQUITETO pode editar produtos." }, { status: 403 });
    }

    const { id } = await params;
    const data = await req.json();

    const produto = await prisma.produto.update({
      where: { id },
      data: {
        ...(data.nome && { nome: data.nome.trim() }),
        ...(data.descricao !== undefined && { descricao: data.descricao?.trim() || null }),
        ...(data.preco !== undefined && { preco: parseFloat(data.preco) }),
        ...(data.categoria !== undefined && { categoria: data.categoria?.trim() || null }),
        ...(data.isPromocao !== undefined && { isPromocao: data.isPromocao === true }),
        ...(data.isTfp !== undefined && { isTfp: data.isTfp === true }),
        ...(data.coverImageKey !== undefined && { coverImageKey: data.coverImageKey?.trim() || null }),
      },
    });

    return NextResponse.json({ produto }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Erro ao atualizar produto:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar produto" },
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
      return NextResponse.json({ error: "Acesso negado. Apenas ARQUITETO pode excluir produtos." }, { status: 403 });
    }

    const { id } = await params;
    const userId = (session.user as any)?.id;

    // Soft delete
    await prisma.produto.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Registrar auditoria
    await logDeleteAction(userId, "Produto", id, {
      nome: (await prisma.produto.findUnique({ where: { id }, select: { nome: true } }))?.nome,
    });

    return NextResponse.json({ message: "Produto excluído com sucesso" }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Erro ao excluir produto:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao excluir produto" },
      { status: 500 }
    );
  }
}

