/**
 * API de Intenções de Compra
 * GET: Lista intenções (filtrado por modeloId se fornecido)
 * POST: Cria intenção de compra
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
    const userId = (session.user as any)?.id;
    const searchParams = req.nextUrl.searchParams;
    const modeloId = searchParams.get("modeloId");

    // MODELO só vê suas próprias intenções
    // ARQUITETO/ADMIN vê todas
    const where: any = {};
    if (userRole === Role.MODELO) {
      where.modeloId = userId;
    } else if (modeloId) {
      where.modeloId = modeloId;
    }

    const intencoes = await prisma.intencaoCompra.findMany({
      where,
      include: {
        produto: {
          select: {
            id: true,
            nome: true,
            precoEuro: true,
            coverImageKey: true,
          },
        },
        modelo: {
          select: {
            id: true,
            name: true,
            email: true,
            cpf: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ intencoes }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Erro ao listar intenções:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao listar intenções" },
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
    const userId = (session.user as any)?.id;

    // Apenas MODELO pode criar intenção de compra
    if (userRole !== Role.MODELO) {
      return NextResponse.json({ error: "Apenas modelos podem criar intenções de compra." }, { status: 403 });
    }

    const { produtoId } = await req.json();

    if (!produtoId) {
      return NextResponse.json({ error: "produtoId é obrigatório" }, { status: 400 });
    }

    // Verificar se produto existe
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
    });

    if (!produto) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    // Verificar se já existe intenção pendente para este produto
    const existing = await prisma.intencaoCompra.findFirst({
      where: {
        modeloId: userId,
        produtoId,
        status: "PENDENTE",
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Você já tem uma intenção de compra pendente para este produto." },
        { status: 400 }
      );
    }

    const intencao = await prisma.intencaoCompra.create({
      data: {
        modeloId: userId,
        produtoId,
        status: "PENDENTE",
      },
      include: {
        produto: {
          select: {
            id: true,
            slug: true,
            nome: true,
            precoEuro: true,
          },
        },
      },
    });

    return NextResponse.json({ intencao }, { status: 201 });
  } catch (error: any) {
    console.error("[API] Erro ao criar intenção:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar intenção" },
      { status: 500 }
    );
  }
}

