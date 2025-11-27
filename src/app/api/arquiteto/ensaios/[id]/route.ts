import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isArquitetoSessionReadOnly } from "@/lib/arquiteto-session";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/arquiteto/ensaios/[id]
 * Obter detalhes de um ensaio (ARQUITETO e ADMIN podem ver)
 */
export async function GET(
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
    const userId = (session.user as any)?.id;

    // ARQUITETO e ADMIN podem ver
    if (userRole !== Role.ARQUITETO && userRole !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas ARQUITETO ou ADMIN podem ver ensaios." },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Buscar ensaio com todas as informações (apenas não deletados)
    const ensaio = await prisma.ensaio.findFirst({
      where: { 
        id,
        deletedAt: null, // Apenas ensaios não deletados
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            email: true,
            cpf: true,
            role: true,
          },
        },
        photos: {
          where: { deletedAt: null }, // Apenas fotos não deletadas
          orderBy: [
            { sortOrder: "asc" },
            { createdAt: "desc" },
          ],
        },
      },
    });

    if (!ensaio) {
      return NextResponse.json(
        { error: "Ensaio não encontrado." },
        { status: 404 }
      );
    }

    // ARQUITETO pode ver todos os seus ensaios ou todos se for o criador
    // ADMIN pode ver todos
    if (userRole === Role.ARQUITETO && ensaio.createdById !== userId) {
      return NextResponse.json(
        { error: "Acesso negado. Você só pode ver seus próprios ensaios." },
        { status: 403 }
      );
    }

    return NextResponse.json(ensaio);
  } catch (error: any) {
    console.error("[API] Erro ao buscar ensaio:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar ensaio." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/arquiteto/ensaios/[id]
 * Atualizar um ensaio (apenas ARQUITETO pode editar)
 */
export async function PATCH(
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
        { error: "Acesso negado. Apenas ARQUITETO pode editar ensaios." },
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

    // Verificar se o ensaio existe e pertence ao ARQUITETO (apenas não deletados)
    const existingEnsaio = await prisma.ensaio.findFirst({
      where: { 
        id,
        deletedAt: null, // Apenas ensaios não deletados
      },
      select: { createdById: true },
    });

    if (!existingEnsaio) {
      return NextResponse.json(
        { error: "Ensaio não encontrado." },
        { status: 404 }
      );
    }

    if (existingEnsaio.createdById !== userId) {
      return NextResponse.json(
        { error: "Acesso negado. Você só pode editar seus próprios ensaios." },
        { status: 403 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (body.title !== undefined) {
      updateData.title = body.title.trim();
    }

    if (body.slug !== undefined) {
      const slug = body.slug.trim();
      // Verificar se o slug já está em uso por outro ensaio
      const existingSlug = await prisma.ensaio.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });
      if (existingSlug) {
        return NextResponse.json(
          { error: "Já existe um ensaio com este slug." },
          { status: 400 }
        );
      }
      updateData.slug = slug;
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    if (body.shootDate !== undefined) {
      updateData.shootDate = body.shootDate ? new Date(body.shootDate) : null;
    }

    if (body.status !== undefined) {
      if (body.status !== "DRAFT" && body.status !== "PUBLISHED") {
        return NextResponse.json(
          { error: "Status inválido. Deve ser DRAFT ou PUBLISHED." },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    if (body.coverImageKey !== undefined) {
      updateData.coverImageKey = body.coverImageKey?.trim() || null;
    }

    if (body.termPdfKey !== undefined) {
      updateData.termPdfKey = body.termPdfKey?.trim() || null;
    }

    if (body.syncFolderUrl !== undefined) {
      updateData.syncFolderUrl = body.syncFolderUrl?.trim() || null;
    }

    // Atualizar ensaio
    const ensaio = await prisma.ensaio.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            email: true,
            cpf: true,
            role: true,
          },
        },
        photos: {
          orderBy: [
            { sortOrder: "asc" },
            { createdAt: "desc" },
          ],
        },
      },
    });

    return NextResponse.json(
      { message: "Ensaio atualizado com sucesso.", ensaio },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API] Erro ao atualizar ensaio:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar ensaio." },
      { status: 500 }
    );
  }
}

