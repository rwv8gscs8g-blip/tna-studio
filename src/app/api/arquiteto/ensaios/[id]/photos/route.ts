import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isArquitetoSessionReadOnly } from "@/lib/arquiteto-session";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/arquiteto/ensaios/[id]/photos
 * Adicionar foto ao ensaio (apenas ARQUITETO)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role as Role;
    if (userRole !== Role.ARQUITETO) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas ARQUITETO pode adicionar fotos." },
        { status: 403 }
      );
    }

    const userId = (session.user as any)?.id;
    
    // Verificar se está em modo somente leitura
    const sessionId = (session as any)?.arquitetoSessionId;
    if (sessionId) {
      const isReadOnly = await isArquitetoSessionReadOnly(userId, sessionId);
      if (isReadOnly) {
        return NextResponse.json(
          { error: "Sessão em modo somente leitura. Existe outra sessão ativa mais recente. Faça login novamente para retomar os poderes de edição." },
          { status: 403 }
        );
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário não encontrado." },
        { status: 400 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { imageUrl, sortOrder } = body;

    // Validações
    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
      return NextResponse.json(
        { error: "URL da imagem é obrigatória." },
        { status: 400 }
      );
    }

    // Verificar se o ensaio existe e pertence ao ARQUITETO (apenas não deletados)
    const ensaio = await prisma.ensaio.findFirst({
      where: { 
        id,
        deletedAt: null, // Apenas ensaios não deletados
      },
      select: { 
        id: true,
        createdById: true,
        photos: {
          where: { deletedAt: null }, // Apenas fotos não deletadas
          select: { id: true },
        },
      },
    });

    if (!ensaio) {
      return NextResponse.json(
        { error: "Ensaio não encontrado." },
        { status: 404 }
      );
    }

    if (ensaio.createdById !== userId) {
      return NextResponse.json(
        { error: "Acesso negado. Você só pode adicionar fotos aos seus próprios ensaios." },
        { status: 403 }
      );
    }

    // Limitar a 30 fotos por ensaio
    if (ensaio.photos.length >= 30) {
      return NextResponse.json(
        { error: "Limite de 30 fotos por ensaio atingido." },
        { status: 400 }
      );
    }

    // Criar foto
    const photo = await prisma.ensaioPhoto.create({
      data: {
        ensaioId: id,
        imageUrl: imageUrl.trim(),
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : ensaio.photos.length,
      },
    });

    return NextResponse.json(
      { message: "Foto adicionada com sucesso.", photo },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API] Erro ao adicionar foto:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao adicionar foto." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/arquiteto/ensaios/[id]/photos
 * Atualizar ordem das fotos (apenas ARQUITETO)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role as Role;
    if (userRole !== Role.ARQUITETO) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas ARQUITETO pode ordenar fotos." },
        { status: 403 }
      );
    }

    const userId = (session.user as any)?.id;
    
    // Verificar se está em modo somente leitura
    const sessionId = (session as any)?.arquitetoSessionId;
    if (sessionId) {
      const isReadOnly = await isArquitetoSessionReadOnly(userId, sessionId);
      if (isReadOnly) {
        return NextResponse.json(
          { error: "Sessão em modo somente leitura. Existe outra sessão ativa mais recente. Faça login novamente para retomar os poderes de edição." },
          { status: 403 }
        );
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário não encontrado." },
        { status: 400 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { photoOrders } = body; // Array de { photoId, sortOrder }

    if (!Array.isArray(photoOrders)) {
      return NextResponse.json(
        { error: "photoOrders deve ser um array de { photoId, sortOrder }." },
        { status: 400 }
      );
    }

    // Verificar se o ensaio existe e pertence ao ARQUITETO (apenas não deletados)
    const ensaio = await prisma.ensaio.findFirst({
      where: { 
        id,
        deletedAt: null, // Apenas ensaios não deletados
      },
      select: { 
        id: true,
        createdById: true,
      },
    });

    if (!ensaio) {
      return NextResponse.json(
        { error: "Ensaio não encontrado." },
        { status: 404 }
      );
    }

    if (ensaio.createdById !== userId) {
      return NextResponse.json(
        { error: "Acesso negado. Você só pode ordenar fotos dos seus próprios ensaios." },
        { status: 403 }
      );
    }

    // Atualizar ordem de cada foto
    await Promise.all(
      photoOrders.map(({ photoId, sortOrder }: { photoId: string; sortOrder: number }) =>
        prisma.ensaioPhoto.update({
          where: { id: photoId, ensaioId: id },
          data: { sortOrder: parseInt(sortOrder) },
        })
      )
    );

    return NextResponse.json(
      { message: "Ordem das fotos atualizada com sucesso." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API] Erro ao ordenar fotos:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao ordenar fotos." },
      { status: 500 }
    );
  }
}

