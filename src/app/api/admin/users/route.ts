/**
 * API de usuários administrativos
 * 
 * POST /api/admin/users - Cria novo usuário (requer Certificado A1 se CERT_A1_ENFORCE_WRITES=true)
 * PUT /api/admin/users/[id] - Edita usuário (requer Certificado A1)
 * DELETE /api/admin/users/[id] - Deleta usuário (requer Certificado A1)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canWriteOperation, canReadOperation } from "@/lib/write-guard-arquiteto";
import { isArquitetoSessionReadOnly } from "@/lib/arquiteto-session";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST - Cria usuário (requer Certificado A1)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role as Role;

    // Apenas ARQUITETO pode criar usuários
    // ADMIN e SUPERADMIN têm acesso somente leitura

    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const role = Object.values(Role).includes(body?.role) ? body.role : Role.MODELO;
    const cpf = typeof body?.cpf === "string" ? body.cpf.replace(/\D/g, "") : null;
    const phone = typeof body?.phone === "string" ? body.phone.trim() : null;
    const birthDate = typeof body?.birthDate === "string" ? body.birthDate : null;

    // Validações obrigatórias
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email é obrigatório." }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Senha é obrigatória e deve ter pelo menos 8 caracteres." }, { status: 400 });
    }
    if (!cpf || cpf.length !== 11) {
      return NextResponse.json({ error: "CPF é obrigatório e deve ter 11 dígitos." }, { status: 400 });
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Telefone é obrigatório." }, { status: 400 });
    }
    if (!birthDate) {
      return NextResponse.json({ error: "Data de nascimento é obrigatória." }, { status: 400 });
    }
    
    // Validar idade mínima (18 anos)
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    if (age < 18) {
      return NextResponse.json({ error: "Usuário deve ter pelo menos 18 anos." }, { status: 400 });
    }

    // Obter IP e User-Agent para auditoria
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Apenas ARQUITETO pode criar usuários
    if (userRole !== Role.ARQUITETO) {
      return NextResponse.json(
        { error: "Apenas usuários com perfil ARQUITETO podem criar usuários" },
        { status: 403 }
      );
    }

    // Validar com guards de escrita (apenas ARQUITETO, com Certificado A1)
    const sessionId = (session as any)?.arquitetoSessionId;
    const operationId = `create_user_${Date.now()}`;
    const guard = await canWriteOperation(
      userId,
      userRole,
      "create_user",
      operationId,
      { email, name, role }, // Não incluir senha no payload de auditoria
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

    // Verificar se email já existe
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email já cadastrado." }, { status: 409 });
    }

    // Verificar CPF único (já normalizado acima)
    const existingCpf = await prisma.user.findUnique({ where: { cpf } });
    if (existingCpf) {
      return NextResponse.json({ error: "CPF já cadastrado para outro usuário." }, { status: 409 });
    }

    // Se passou pelos guards, criar usuário
    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: { 
        email, 
        name: name || null, 
        passwordHash, 
        role,
        // Campos obrigatórios
        cpf,
        phone,
        birthDate: new Date(birthDate),
        // Campos opcionais do body
        passport: body?.passport?.trim().toUpperCase() || null,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}

