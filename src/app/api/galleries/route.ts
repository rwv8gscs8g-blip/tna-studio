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

    if (userRole === Role.ADMIN) {
      // Admin vê todas as galerias
      galleries = await prisma.gallery.findMany({
        include: {
          user: {
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
            _count: { photos: photoCount },
          };
        })
      );
    } else {
      // Usuário vê suas próprias galerias + galerias com acesso concedido
      const owned = await prisma.gallery.findMany({
        where: { userId },
        include: {
          _count: {
            select: { photos: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const accessed = await prisma.galleryAccess.findMany({
        where: { granteeId: userId },
        include: {
          gallery: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
              _count: {
                select: { photos: true },
              },
            },
          },
        },
      });

      galleries = [
        ...owned.map((g) => ({ ...g, user: null })),
        ...accessed.map((a) => a.gallery),
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

// POST - Cria galeria
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

    const body = await req.json();
    const { title, description, isPrivate } = body;

    if (!title) {
      return NextResponse.json({ error: "title é obrigatório" }, { status: 400 });
    }

    const gallery = await prisma.gallery.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        userId,
        isPrivate: isPrivate !== false, // Default true
      },
      include: {
        _count: {
          select: { photos: true },
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

