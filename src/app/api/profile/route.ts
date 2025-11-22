/**
 * API de Perfil
 * 
 * GET /api/profile - Obtém dados do perfil do usuário
 * PATCH /api/profile/update - Atualiza dados do perfil
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Obtém dados do perfil
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        cpf: true,
        passport: true,
        birthDate: true,
        role: true,
        profileImage: true,
        personalDescription: true,
        address: true,
        zipCode: true,
        city: true,
        state: true,
        country: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar perfil" },
      { status: 500 }
    );
  }
}

