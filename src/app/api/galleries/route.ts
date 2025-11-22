/**
 * API de galerias
 * 
 * GET /api/galleries - Lista galerias do usuário
 * POST /api/galleries - Cria nova galeria
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessGallery } from "@/lib/image-rights";
import { canWriteOperation, canReadOperation } from "@/lib/write-guard-arquiteto";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Lista galerias
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não encontrado na sessão" }, { status: 401 });
    }

    const userRole = (session.user as any).role as Role;

    let galleries;

    // ARQUITETO e ADMIN podem ver todas as galerias (leitura)
    if (userRole === Role.ARQUITETO || userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN) {
      // Admin vê todas as galerias
      galleries = await prisma.gallery.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          userId: true,
          isPrivate: true,
          createdAt: true,
          updatedAt: true,
          // Não buscar ownerCpf, ownerPassport, sessionDate se não existirem
          User: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      
      // Adiciona _count para cada galeria
      galleries = await Promise.all(
        galleries.map(async (gallery) => {
          const photoCount = await prisma.photo.count({
            where: { galleryId: gallery.id },
          });
          return {
            ...gallery,
            _count: { Photo: photoCount },
          };
        })
      );
    } else {
      // Usuário vê suas próprias galerias + galerias com acesso concedido
      const owned = await prisma.gallery.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          description: true,
          userId: true,
          isPrivate: true,
          createdAt: true,
          updatedAt: true,
          // Não buscar ownerCpf, ownerPassport, sessionDate se não existirem
          _count: {
            select: { Photo: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const accessed = await prisma.galleryAccess.findMany({
        where: { granteeId: userId },
        include: {
          Gallery: {
            include: {
              User: {
                select: { id: true, name: true, email: true },
              },
              _count: {
                select: { Photo: true },
              },
            },
          },
        },
      });

      galleries = [
        ...owned.map((g) => ({ ...g, User: null })),
        ...accessed.map((a) => a.Gallery),
      ];
    }

    return NextResponse.json(galleries);
  } catch (error: any) {
    console.error("Erro ao listar galerias:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao listar galerias" },
      { status: 500 }
    );
  }
}

// POST - Cria galeria (requer Certificado A1 se CERT_A1_ENFORCE_WRITES=true)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não encontrado na sessão" }, { status: 401 });
    }

    const userRole = (session.user as any).role as Role;

    // Apenas ARQUITETO pode criar galerias
    // ADMIN e SUPER_ADMIN têm acesso somente leitura

    const body = await req.json();
    const { title, description, isPrivate } = body;

    if (!title) {
      return NextResponse.json({ error: "title é obrigatório" }, { status: 400 });
    }

    // Obter IP e User-Agent para auditoria
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Validar com guards de escrita (apenas ARQUITETO, com Certificado A1)
    const operationId = `create_gallery_${Date.now()}`;
    const guard = await canWriteOperation(
      userId,
      userRole,
      "create_gallery",
      operationId,
      { title, description, isPrivate },
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

    // Se passou pelos guards, criar galeria
    const gallery = await prisma.gallery.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        userId,
        isPrivate: true, // Sempre privada (obrigatório)
      },
      include: {
        _count: {
          select: { Photo: true },
        },
      },
    });

    return NextResponse.json(gallery, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar galeria:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar galeria" },
      { status: 500 }
    );
  }
}

