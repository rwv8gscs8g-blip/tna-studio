/**
 * API de Atualização de Perfil
 * 
 * PATCH /api/profile/update - Atualiza dados do perfil do usuário
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { canEditProfile } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
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
    const body = await req.json();
    const { name, phone, cpf, passport, birthDate, password, targetUserId } = body;
    
    // Verificar permissão para editar perfil
    const targetId = targetUserId || userId; // Se não especificado, edita próprio perfil
    const permission = canEditProfile(userRole, targetId, userId);
    
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.error || "Acesso negado" },
        { status: 403 }
      );
    }
    
    // CLIENTE não pode alterar CPF (chave para galerias)
    if (userRole === Role.CLIENTE && cpf !== undefined) {
      return NextResponse.json(
        { error: "Clientes não podem alterar o CPF. O CPF é usado como chave para suas galerias." },
        { status: 403 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name.trim() || null;
    }

    if (phone !== undefined) {
      // Validar formato E.164 se fornecido
      if (phone && !phone.startsWith("+")) {
        return NextResponse.json(
          { error: "Telefone deve estar no formato internacional (+CC DDD Número)" },
          { status: 400 }
        );
      }
      updateData.phone = phone?.trim() || null;
    }

    if (cpf !== undefined) {
      // Validar CPF se fornecido
      const cpfClean = cpf?.replace(/\D/g, "") || "";
      if (cpfClean && cpfClean.length !== 11) {
        return NextResponse.json(
          { error: "CPF inválido. Deve ter 11 dígitos." },
          { status: 400 }
        );
      }
      // Verificar se CPF já está em uso por outro usuário
      if (cpfClean) {
        const existing = await prisma.user.findFirst({
          where: {
            cpf: cpfClean,
            id: { not: userId },
          },
        });
        if (existing) {
          return NextResponse.json(
            { error: "CPF já está cadastrado para outro usuário." },
            { status: 409 }
          );
        }
      }
      updateData.cpf = cpfClean || null;
    }

    if (passport !== undefined) {
      // Validar formato ICAO se fornecido
      const passportClean = passport?.trim().toUpperCase() || "";
      if (passportClean && !/^[A-Z]{2}[A-Z0-9]{6,9}$/.test(passportClean)) {
        return NextResponse.json(
          { error: "Passaporte inválido. Formato: 2 letras + 6-9 alfanuméricos (ICAO)." },
          { status: 400 }
        );
      }
      // Verificar se passaporte já está em uso por outro usuário
      if (passportClean) {
        const existing = await prisma.user.findFirst({
          where: {
            passport: passportClean,
            id: { not: userId },
          },
        });
        if (existing) {
          return NextResponse.json(
            { error: "Passaporte já está cadastrado para outro usuário." },
            { status: 409 }
          );
        }
      }
      updateData.passport = passportClean || null;
    }

    if (birthDate !== undefined) {
      if (birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (age < 18 || (age === 18 && monthDiff < 0) || (age === 18 && monthDiff === 0 && today.getDate() < birth.getDate())) {
          return NextResponse.json(
            { error: "Você deve ter pelo menos 18 anos." },
            { status: 400 }
          );
        }
      }
      updateData.birthDate = birthDate ? new Date(birthDate) : null;
    }

    if (password) {
      // Validar senha forte
      if (password.length < 8) {
        return NextResponse.json(
          { error: "A senha deve ter no mínimo 8 caracteres." },
          { status: 400 }
        );
      }
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSymbol = /[^A-Za-z0-9]/.test(password);

      if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
        return NextResponse.json(
          { error: "A senha deve conter: maiúscula, minúscula, número e símbolo." },
          { status: 400 }
        );
      }

      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    // Atualizar usuário (pode ser próprio ou outro se for ARQUITETO)
    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        cpf: true,
        passport: true,
        birthDate: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, user: updatedUser });
  } catch (error: any) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}
