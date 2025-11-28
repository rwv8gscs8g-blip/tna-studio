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

    const where: any = {
      deletedAt: null, // Apenas produtos não deletados
      isActive: true, // Apenas produtos ativos
    };
    if (categoria) where.categoria = categoria;

    const produtos = await prisma.produto.findMany({
      where,
      include: {
        photos: {
          where: { deletedAt: null }, // Apenas fotos não deletadas
        },
        _count: {
          select: {
            ensaios: true,
            intencoes: true,
          },
        },
      },
      orderBy: [
        { displayOrder: "asc" },
        { categoria: "asc" },
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

/**
 * Helper: Gera slug a partir do nome
 */
function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]+/g, "-") // Substitui caracteres especiais por hífen
    .replace(/^-+|-+$/g, ""); // Remove hífens no início e fim
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

    const { nome, shortDescription, fullDescription, precoEuro, categoria, coverImageKey } = await req.json();

    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    // Gerar slug a partir do nome
    let slug = generateSlug(nome.trim());
    
    // Verificar se slug já existe e adicionar sufixo numérico se necessário
    let finalSlug = slug;
    let counter = 1;
    while (await prisma.produto.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const produto = await prisma.produto.create({
      data: {
        slug: finalSlug,
        nome: nome.trim(),
        shortDescription: shortDescription?.trim() || null,
        fullDescription: fullDescription?.trim() || null,
        precoEuro: precoEuro !== undefined && precoEuro !== null ? parseFloat(precoEuro) : null,
        categoria: categoria?.trim() || null,
        isActive: true,
        coverImageKey: coverImageKey?.trim() || null,
      },
      select: {
        id: true,
        slug: true,
        nome: true,
        shortDescription: true,
        fullDescription: true,
        precoEuro: true,
        categoria: true,
        isActive: true,
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

