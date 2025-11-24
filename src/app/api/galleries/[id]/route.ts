/**
 * API de detalhes de galeria
 * 
 * GET /api/galleries/[id] - Detalhes da galeria
 * PATCH /api/galleries/[id] - Atualiza galeria (apenas ADMIN com certificado A1)
 * DELETE /api/galleries/[id] - Remove galeria (apenas ADMIN com certificado A1)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessGallery } from "@/lib/image-rights";
import { canWriteOperation, canReadOperation } from "@/lib/write-guard-arquiteto";
import { Role } from "@prisma/client";
import { logDeleteAction } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Detalhes da galeria
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não encontrado na sessão" }, { status: 401 });
    }

    const { id } = await params;
    const userRole = (session.user as any).role as Role;

    // Verificar permissão de leitura (busca apenas userId primeiro, apenas não deletados)
    const galleryCheck = await prisma.gallery.findFirst({
      where: { 
        id,
        deletedAt: null, // Apenas galerias não deletadas
      },
      select: { userId: true },
    });

    if (!galleryCheck) {
      return NextResponse.json({ error: "Galeria não encontrada" }, { status: 404 });
    }

    // Verificar se pode ler (ARQUITETO/ADMIN/SUPER_ADMIN podem ler tudo, outros apenas suas próprias)
    const readCheck = await canReadOperation(userId, userRole, galleryCheck.userId || undefined);
    if (!readCheck.allowed) {
      return NextResponse.json(
        { error: readCheck.reason || "Acesso negado" },
        { status: 403 }
      );
    }

    // Buscar galeria completa com todos os dados (apenas não deletados)
    const gallery = await prisma.gallery.findFirst({
      where: { 
        id,
        deletedAt: null, // Apenas galerias não deletadas
      },
      include: {
        User: {
          where: { deletedAt: null }, // Apenas usuários não deletados
          select: { id: true, name: true, email: true },
        },
        Photo: {
          where: { deletedAt: null }, // Apenas fotos não deletadas
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            key: true,
            title: true,
            mimeType: true,
            bytes: true,
            isSensitive: true,
            createdAt: true,
          },
        },
        _count: {
          select: { Photo: true },
        },
      },
    });

    if (!gallery) {
      return NextResponse.json({ error: "Galeria não encontrada" }, { status: 404 });
    }

    return NextResponse.json(gallery);
  } catch (error: any) {
    console.error("Erro ao buscar galeria:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar galeria" },
      { status: 500 }
    );
  }
}

// PATCH - Atualiza galeria (apenas ADMIN com certificado A1)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não encontrado na sessão" }, { status: 401 });
    }

    const { id } = await params;
    const userRole = (session.user as any).role as Role;

    // Apenas ARQUITETO pode editar galerias
    // ADMIN e SUPER_ADMIN têm acesso somente leitura

    const body = await req.json();
    const { title, description } = body;

    // Obter IP e User-Agent para auditoria
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Validar com guards de escrita (apenas ARQUITETO, com Certificado A1)
    const operationId = `update_gallery_${id}_${Date.now()}`;
    const guard = await canWriteOperation(
      userId,
      userRole,
      "update_gallery",
      operationId,
      { galleryId: id, title, description },
      ip,
      userAgent
    );

    if (!guard.allowed) {
      return NextResponse.json(
        { 
          error: guard.reason || "Operação bloqueada pelos guards de segurança",
          failedLayer: guard.failedLayer,
          details: guard.details
        },
        { status: 403 }
      );
    }

    // Verificar se galeria existe
    const existing = await prisma.gallery.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Galeria não encontrada" }, { status: 404 });
    }

    // Atualizar galeria (isPrivate sempre true)
    const gallery = await prisma.gallery.update({
      where: { id },
      data: {
        title: title ? title.trim() : undefined,
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
        isPrivate: true, // Sempre privada
      },
      include: {
        User: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { Photo: true },
        },
      },
    });

    return NextResponse.json(gallery);
  } catch (error: any) {
    console.error("Erro ao atualizar galeria:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar galeria" },
      { status: 500 }
    );
  }
}

// DELETE - Remove galeria (apenas ADMIN com certificado A1)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não encontrado na sessão" }, { status: 401 });
    }

    const { id } = await params;
    const userRole = (session.user as any).role as Role;

    // Apenas ARQUITETO pode deletar galerias
    // ADMIN e SUPER_ADMIN têm acesso somente leitura

    // Obter IP e User-Agent para auditoria
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Validar com guards de escrita (apenas ARQUITETO, com Certificado A1)
    const operationId = `delete_gallery_${id}_${Date.now()}`;
    const guard = await canWriteOperation(
      userId,
      userRole,
      "delete_gallery",
      operationId,
      { galleryId: id },
      ip,
      userAgent
    );

    if (!guard.allowed) {
      return NextResponse.json(
        { 
          error: guard.reason || "Operação bloqueada pelos guards de segurança",
          failedLayer: guard.failedLayer,
          details: guard.details
        },
        { status: 403 }
      );
    }

    // Verificar se galeria existe
    const existing = await prisma.gallery.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Galeria não encontrada" }, { status: 404 });
    }

    // Soft delete
    await prisma.gallery.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Registrar auditoria
    await logDeleteAction(userId, "Gallery", id, {
      title: existing.title,
      userId: existing.userId,
    });

    return NextResponse.json({ ok: true, message: "Galeria deletada com sucesso" });
  } catch (error: any) {
    console.error("Erro ao deletar galeria:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao deletar galeria" },
      { status: 500 }
    );
  }
}
