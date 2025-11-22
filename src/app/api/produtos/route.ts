/**
 * API de Produtos
 * GET: Lista produtos
 * POST: Cria produto (apenas ARQUITETO)
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
    const categoria = searchParams.get("categoria");
    const promocao = searchParams.get("promocao") === "true";
    const tfp = searchParams.get("tfp") === "true";

    const where: any = {};
    if (categoria) where.categoria = categoria;
    if (promocao) where.isPromocao = true;
    if (tfp) where.isTfp = true;

    const produtos = await prisma.produto.findMany({
      where,
      include: {
        _count: {
          select: {
            ensaios: true,
            intencoes: true,
          },
        },
      },
      orderBy: [
        { isPromocao: "desc" },
        { isTfp: "desc" },
        { nome: "asc" },
      ],
    });

    return NextResponse.json({ produtos }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Erro ao listar produtos:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao listar produtos" },
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
      return NextResponse.json({ error: "Acesso negado. Apenas ARQUITETO pode criar produtos." }, { status: 403 });
    }

    const { nome, descricao, preco, categoria, isPromocao, isTfp, coverImageKey } = await req.json();

    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    if (preco === undefined || preco === null || preco < 0) {
      return NextResponse.json({ error: "Preço é obrigatório e deve ser >= 0" }, { status: 400 });
    }

    const produto = await prisma.produto.create({
      data: {
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        preco: parseFloat(preco),
        categoria: categoria?.trim() || null,
        isPromocao: isPromocao === true,
        isTfp: isTfp === true,
        coverImageKey: coverImageKey?.trim() || null,
      },
      select: {
        id: true,
        nome: true,
        descricao: true,
        preco: true,
        categoria: true,
        isPromocao: true,
        isTfp: true,
        coverImageKey: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ produto }, { status: 201 });
  } catch (error: any) {
    console.error("[API] Erro ao criar produto:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar produto" },
      { status: 500 }
    );
  }
}

