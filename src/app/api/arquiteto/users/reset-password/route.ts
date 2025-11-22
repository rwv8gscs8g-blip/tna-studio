import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/arquiteto/users/reset-password
 * Resetar senha de um usuário (apenas ARQUITETO)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role as Role;
    
    // Apenas ARQUITETO pode resetar senhas
    if (userRole !== Role.ARQUITETO) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas ARQUITETO pode resetar senhas." },
        { status: 403 }
      );
    }

    const { userId, newPassword } = await req.json();

    // Validações básicas
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "A nova senha é obrigatória e deve ter pelo menos 8 caracteres." },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    // Hash da nova senha
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Atualizar senha
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return NextResponse.json(
      {
        message: `Senha do usuário ${user.email || user.name || userId} atualizada com sucesso.`,
        userId: user.id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API] Erro ao resetar senha:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao resetar senha." },
      { status: 500 }
    );
  }
}

