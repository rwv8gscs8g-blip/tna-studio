/**
 * API de Relatórios Administrativos
 * 
 * GET /api/admin/reports - Obtém dados para relatórios
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

    const userRole = (session.user as any).role as Role;

    // ADMIN e ARQUITETO podem ver relatórios
    if (userRole !== Role.ADMIN && userRole !== Role.ARQUITETO) {
      return NextResponse.json(
        { error: "Apenas administradores e arquitetos podem ver relatórios" },
        { status: 403 }
      );
    }

    // Buscar todos os usuários (até 30 para relatórios)
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        cpf: true,
        birthDate: true,
        createdAt: true,
      },
    });

    // Calcular contadores (não somar duplicado, cada usuário conta uma vez)
    const totalUsers = await prisma.user.count();
    const arquitetoCount = await prisma.user.count({ where: { role: Role.ARQUITETO } });
    const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
    const modeloCount = await prisma.user.count({ where: { role: Role.MODELO } });
    const clienteCount = await prisma.user.count({ where: { role: Role.CLIENTE } });
    const superAdminCount = await prisma.user.count({ where: { role: Role.SUPERADMIN } });

    return NextResponse.json({ 
      users,
      totalUsers,
      arquitetoCount,
      adminCount,
      modeloCount,
      clienteCount,
      superAdminCount,
    });
  } catch (error: any) {
    console.error("Erro ao buscar relatórios:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar relatórios" },
      { status: 500 }
    );
  }
}

