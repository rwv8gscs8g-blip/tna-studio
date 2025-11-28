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

    // Gerar slug se nome mudou
    let updateData: any = {};
    if (data.nome) {
      const nome = data.nome.trim();
      updateData.nome = nome;
      // Gerar slug a partir do nome
      const slug = nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      // Verificar se slug já existe para outro produto
      const existing = await prisma.produto.findUnique({ where: { slug } });
      if (!existing || existing.id === id) {
        updateData.slug = slug;
      } else {
        // Adicionar sufixo numérico
        let finalSlug = slug;
        let counter = 1;
        while (await prisma.produto.findUnique({ where: { slug: finalSlug } })) {
          finalSlug = `${slug}-${counter}`;
          counter++;
        }
        updateData.slug = finalSlug;
      }
    }
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription?.trim() || null;
    if (data.fullDescription !== undefined) updateData.fullDescription = data.fullDescription?.trim() || null;
    if (data.precoEuro !== undefined) updateData.precoEuro = data.precoEuro !== null ? parseFloat(data.precoEuro) : null;
    if (data.categoria !== undefined) updateData.categoria = data.categoria?.trim() || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive === true;
    if (data.coverImageKey !== undefined) updateData.coverImageKey = data.coverImageKey?.trim() || null;
    if (data.displayOrder !== undefined) updateData.displayOrder = parseInt(data.displayOrder) || 0;

    const produto = await prisma.produto.update({
      where: { id },
      data: updateData,
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

