/**
 * API para upload de fotos de produto
 * Apenas ARQUITETO pode fazer upload
 * Máximo 3 fotos por produto
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40 MB (dev)
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/webp", "image/png"];
const MAX_PHOTOS_PER_PRODUCT = 3;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userRole = (session.user as any)?.role as Role;
    
    // Apenas ARQUITETO pode fazer upload
    if (userRole !== Role.ARQUITETO) {
      return NextResponse.json({ error: "Acesso negado. Apenas ARQUITETO pode fazer upload." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const produtoId = formData.get("produtoId") as string;

    if (!file) {
      return NextResponse.json({ error: "Arquivo é obrigatório" }, { status: 400 });
    }

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

    // Verificar limite de fotos (máximo 3)
    const photoCount = await prisma.produtoPhoto.count({
      where: {
        produtoId,
        deletedAt: null,
      },
    });

    if (photoCount >= MAX_PHOTOS_PER_PRODUCT) {
      return NextResponse.json(
        { error: `Limite de ${MAX_PHOTOS_PER_PRODUCT} fotos por produto atingido. Remova uma foto antes de adicionar outra.` },
        { status: 400 }
      );
    }

    // Validação de tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 400 }
      );
    }

    // Validação de tipo
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de imagem não permitido. Use: JPEG, WebP ou PNG.` },
        { status: 400 }
      );
    }

    // Gerar chave R2
    const timestamp = Date.now();
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const key = `produto-${produtoId}/photo-${timestamp}.${extension}`;

    // Upload para R2
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, file.type);

    // Criar registro na tabela ProdutoPhoto
    const photo = await prisma.produtoPhoto.create({
      data: {
        produtoId,
        storageKey: key,
        sortOrder: photoCount, // Ordem baseada na quantidade atual
      },
      select: {
        id: true,
        storageKey: true,
        sortOrder: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ 
      photo,
      key,
      size: file.size,
      type: file.type,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[API] Erro ao fazer upload de foto de produto:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao fazer upload" },
      { status: 500 }
    );
  }
}

