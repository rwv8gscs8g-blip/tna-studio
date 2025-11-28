/**
 * API para atualização de senha
 * 
 * PATCH /api/profile/update-password
 * 
 * Permissões:
 * - ARQUITETO: Pode alterar própria senha E a de qualquer outro usuário
 * - Outros: Podem alterar apenas a própria senha
 * - ADMIN: Proibido de alterar qualquer senha
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { validateWriteOperation } from "@/lib/security";
import { forbiddenResponse, errorResponse, successResponse } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role as Role;

    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não encontrado na sessão" }, { status: 401 });
    }

    const body = await req.json();
    const { newPassword, targetUserId } = body;

    // Validar nova senha
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return errorResponse("A senha deve ter no mínimo 8 caracteres.", 400);
    }

    // Validar senha forte
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      return errorResponse(
        "A senha deve conter: maiúscula, minúscula, número e símbolo.",
        400
      );
    }

    // Determinar qual usuário terá a senha alterada
    const targetId = targetUserId || userId; // Se não especificado, altera própria senha

    // Verificar permissões
    if (userRole === Role.ADMIN) {
      // ADMIN é proibido de alterar qualquer senha
      return forbiddenResponse("ADMIN não pode alterar senhas. Apenas ARQUITETO pode alterar senhas.");
    }

    // Se está tentando alterar senha de outro usuário, precisa ser ARQUITETO
    if (targetId !== userId && userRole !== Role.ARQUITETO) {
      return forbiddenResponse("Você só pode alterar sua própria senha. Apenas ARQUITETO pode alterar senhas de outros usuários.");
    }

    // Se é ARQUITETO alterando senha de outro usuário, validar operação de escrita
    if (targetId !== userId && userRole === Role.ARQUITETO) {
      const writeCheck = validateWriteOperation(userRole);
      if (writeCheck) {
        return writeCheck; // Retorna erro 403 se bloqueado
      }
    }

    // Verificar se usuário alvo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, email: true },
    });

    if (!targetUser) {
      return errorResponse("Usuário não encontrado.", 404);
    }

    // Gerar hash da nova senha
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Atualizar senha no banco
    await prisma.user.update({
      where: { id: targetId },
      data: { passwordHash },
    });

    // Log de auditoria (opcional)
    console.log(`[Password Update] User ${userId} (${userRole}) updated password for user ${targetId}`);

    return successResponse(
      { message: "Senha alterada com sucesso." },
      targetId === userId ? "Sua senha foi alterada com sucesso." : `Senha do usuário ${targetUser.email} alterada com sucesso.`
    );
  } catch (error: any) {
    console.error("[API] Erro ao atualizar senha:", error);
    return errorResponse(error.message || "Erro ao atualizar senha", 500);
  }
}

