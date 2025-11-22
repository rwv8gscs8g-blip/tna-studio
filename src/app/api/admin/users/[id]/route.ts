/**
 * API de edição de usuários administrativos
 * 
 * GET /api/admin/users/[id] - Obtém dados do usuário
 * PATCH /api/admin/users/[id] - Edita usuário (requer Certificado A1)
 * DELETE /api/admin/users/[id] - Deleta usuário (requer Certificado A1)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canWriteOperation, canReadOperation } from "@/lib/write-guard-arquiteto";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Obtém dados do usuário
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
    const userRole = (session.user as any).role as Role;

    // ARQUITETO, ADMIN e SUPER_ADMIN podem ver dados de usuários
    const readCheck = await canReadOperation(userId, userRole);
    if (!readCheck.allowed) {
      return NextResponse.json(
        { error: readCheck.reason || "Sem permissão para visualizar dados de usuários" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        cpf: true,
        passport: true,
        birthDate: true,
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
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar usuário" },
      { status: 500 }
    );
  }
}

// PATCH - Edita usuário (requer Certificado A1)
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
    const userRole = (session.user as any).role as Role;

    // Apenas ARQUITETO pode editar usuários
    // ADMIN e SUPER_ADMIN têm acesso somente leitura

    const { id } = await params;
    const body = await req.json();

    // Verificar se usuário existe
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (body.name !== undefined) {
      updateData.name = body.name?.trim() || null;
    }

    if (body.email !== undefined) {
      const email = body.email?.toLowerCase().trim();
      if (email) {
        // Verificar se email já está em uso por outro usuário
        const emailExists = await prisma.user.findFirst({
          where: {
            email,
            id: { not: id },
          },
        });
        if (emailExists) {
          return NextResponse.json(
            { error: "Email já está cadastrado para outro usuário." },
            { status: 409 }
          );
        }
        updateData.email = email;
      }
    }

    if (body.phone !== undefined) {
      const phone = body.phone?.trim() || null;
      if (phone && !phone.startsWith("+")) {
        return NextResponse.json(
          { error: "Telefone deve estar no formato internacional (+CC DDD Número)" },
          { status: 400 }
        );
      }
      updateData.phone = phone;
    }

    if (body.cpf !== undefined) {
      const cpf = body.cpf?.replace(/\D/g, "") || null;
      if (cpf && cpf.length !== 11) {
        return NextResponse.json(
          { error: "CPF inválido. Deve ter 11 dígitos." },
          { status: 400 }
        );
      }
      // Verificar se CPF já está em uso por outro usuário
      if (cpf) {
        const cpfExists = await prisma.user.findFirst({
          where: {
            cpf,
            id: { not: id },
          },
        });
        if (cpfExists) {
          return NextResponse.json(
            { error: "CPF já está cadastrado para outro usuário." },
            { status: 409 }
          );
        }
      }
      updateData.cpf = cpf;
    }

    if (body.passport !== undefined) {
      const passport = body.passport?.trim().toUpperCase() || null;
      if (passport && !/^[A-Z]{2}[A-Z0-9]{6,9}$/.test(passport)) {
        return NextResponse.json(
          { error: "Passaporte inválido. Formato: 2 letras + 6-9 alfanuméricos (ICAO)." },
          { status: 400 }
        );
      }
      // Verificar se passaporte já está em uso por outro usuário
      if (passport) {
        const passportExists = await prisma.user.findFirst({
          where: {
            passport,
            id: { not: id },
          },
        });
        if (passportExists) {
          return NextResponse.json(
            { error: "Passaporte já está cadastrado para outro usuário." },
            { status: 409 }
          );
        }
      }
      updateData.passport = passport;
    }

    if (body.birthDate !== undefined) {
      updateData.birthDate = body.birthDate ? new Date(body.birthDate) : null;
    }

    if (body.role !== undefined) {
      if (!Object.values(Role).includes(body.role)) {
        return NextResponse.json(
          { error: "Role inválido" },
          { status: 400 }
        );
      }
      updateData.role = body.role;
    }

    if (body.password !== undefined && body.password) {
      // Validar senha forte
      if (body.password.length < 8) {
        return NextResponse.json(
          { error: "A senha deve ter no mínimo 8 caracteres." },
          { status: 400 }
        );
      }
      const hasUpper = /[A-Z]/.test(body.password);
      const hasLower = /[a-z]/.test(body.password);
      const hasNumber = /[0-9]/.test(body.password);
      const hasSymbol = /[^A-Za-z0-9]/.test(body.password);

      if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
        return NextResponse.json(
          { error: "A senha deve conter: maiúscula, minúscula, número e símbolo." },
          { status: 400 }
        );
      }

      updateData.passwordHash = await bcrypt.hash(body.password, 12);
    }

    // Campos opcionais
    if (body.profileImage !== undefined) updateData.profileImage = body.profileImage;
    if (body.personalDescription !== undefined) updateData.personalDescription = body.personalDescription;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.zipCode !== undefined) updateData.zipCode = body.zipCode;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.country !== undefined) updateData.country = body.country;

    // Obter IP e User-Agent para auditoria
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Apenas ARQUITETO pode editar usuários
    if (userRole !== Role.ARQUITETO) {
      return NextResponse.json(
        { error: "Apenas usuários com perfil ARQUITETO podem editar usuários" },
        { status: 403 }
      );
    }

    // Validar com guards de escrita (apenas ARQUITETO, com Certificado A1)
    const sessionId = (session as any)?.arquitetoSessionId;
    const operationId = `update_user_${id}_${Date.now()}`;
    const guard = await canWriteOperation(
      userId,
      userRole,
      "update_user",
      operationId,
      { userId: id, fields: Object.keys(updateData) }, // Não incluir dados sensíveis no payload
      ip,
      userAgent,
      sessionId // Passar sessionId para validação de sessão
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

    // Se passou pelos guards, atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        cpf: true,
        passport: true,
        birthDate: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, user: updatedUser });
  } catch (error: any) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}

// DELETE - Deleta usuário (requer Certificado A1)
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
    const userRole = (session.user as any).role as Role;

    // Apenas ARQUITETO pode deletar usuários
    // ADMIN e SUPER_ADMIN têm acesso somente leitura

    const { id } = await params;

    // Verificar se usuário existe
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Não permitir deletar a si mesmo
    if (id === userId) {
      return NextResponse.json(
        { error: "Você não pode deletar sua própria conta" },
        { status: 400 }
      );
    }

    // Obter IP e User-Agent para auditoria
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Apenas ARQUITETO pode deletar usuários
    if (userRole !== Role.ARQUITETO) {
      return NextResponse.json(
        { error: "Apenas usuários com perfil ARQUITETO podem deletar usuários" },
        { status: 403 }
      );
    }

    // Validar com guards de escrita (apenas ARQUITETO, com Certificado A1)
    const sessionId = (session as any)?.arquitetoSessionId;
    const operationId = `delete_user_${id}_${Date.now()}`;
    const guard = await canWriteOperation(
      userId,
      userRole,
      "delete_user",
      operationId,
      { userId: id },
      ip,
      userAgent,
      sessionId // Passar sessionId para validação de sessão
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

    // Se passou pelos guards, deletar usuário
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ ok: true, message: "Usuário deletado com sucesso" });
  } catch (error: any) {
    console.error("Erro ao deletar usuário:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao deletar usuário" },
      { status: 500 }
    );
  }
}

