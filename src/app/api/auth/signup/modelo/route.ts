import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, cpf, phone, birthDate } = await req.json();

    // Validações básicas
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório." },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email é obrigatório." },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Senha deve ter pelo menos 8 caracteres." },
        { status: 400 }
      );
    }

    // Normalizar CPF
    const normalizedCpf = typeof cpf === "string" ? cpf.replace(/\D/g, "") : null;
    if (!normalizedCpf || normalizedCpf.length !== 11) {
      return NextResponse.json(
        { error: "CPF é obrigatório e deve ter 11 dígitos." },
        { status: 400 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: "Telefone é obrigatório." },
        { status: 400 }
      );
    }

    if (!birthDate) {
      return NextResponse.json(
        { error: "Data de nascimento é obrigatória." },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Você deve ter pelo menos 18 anos para se cadastrar." },
        { status: 400 }
      );
    }

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();

    // Verificar se já existe usuário com este email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma conta com este email." },
        { status: 409 }
      );
    }

    // Verificar se já existe usuário com este CPF
    const existingCpf = await prisma.user.findUnique({
      where: { cpf: normalizedCpf },
    });

    if (existingCpf) {
      return NextResponse.json(
        { error: "Já existe uma conta com este CPF." },
        { status: 409 }
      );
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Criar usuário MODELO
    // IMPORTANTE: role é sempre MODELO para esta rota
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        passwordHash,
        role: Role.MODELO, // Sempre MODELO - não permite alteração de role
        cpf: normalizedCpf,
        phone: phone.trim(),
        birthDate: new Date(birthDate),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Conta criada com sucesso! Faça login para continuar.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API] Erro ao criar conta de modelo:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar conta." },
      { status: 500 }
    );
  }
}

