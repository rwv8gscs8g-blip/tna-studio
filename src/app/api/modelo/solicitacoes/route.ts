import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Campos permitidos para solicitação de alteração
const ALLOWED_FIELDS = ["phone", "address", "name", "passport", "email"];

// GET: Listar solicitações do usuário
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userRole = (session.user as any)?.role as Role;
    const userId = (session.user as any)?.id;

    // MODELO e CLIENTE podem ver apenas suas próprias solicitações
    if (userRole !== "MODELO" && userRole !== "CLIENTE") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // TODO: ModelChangeRequest não existe no schema - precisa ser criado
    // @ts-ignore - Modelo não existe ainda no schema
    const requests = await prisma.modelChangeRequest?.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        Aprovador: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ requests: requests || [] });
  } catch (error: any) {
    console.error("Erro ao listar solicitações:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao listar solicitações" },
      { status: 500 }
    );
  }
}

// POST: Criar nova solicitação
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userRole = (session.user as any)?.role as Role;
    const userId = (session.user as any)?.id;

    // Apenas MODELO e CLIENTE podem criar solicitações
    if (userRole !== "MODELO" && userRole !== "CLIENTE") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const { campo, valorNovo } = body;

    if (!campo || !valorNovo) {
      return NextResponse.json(
        { error: "Campo e valorNovo são obrigatórios" },
        { status: 400 }
      );
    }

    if (!ALLOWED_FIELDS.includes(campo)) {
      return NextResponse.json(
        { error: `Campo "${campo}" não pode ser alterado via solicitação` },
        { status: 400 }
      );
    }

    // Buscar valor atual do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        phone: true,
        address: true,
        name: true,
        passport: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const valorAntigo = (user as any)[campo] || null;

    // Verificar se já existe solicitação pendente para este campo
    // TODO: ModelChangeRequest não existe no schema - precisa ser criado
    // @ts-ignore - Modelo não existe ainda no schema
    const existingPending = await prisma.modelChangeRequest?.findFirst({
      where: {
        userId,
        campo,
        status: "PENDING",
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "Já existe uma solicitação pendente para este campo" },
        { status: 409 }
      );
    }

    // Criar solicitação
    // TODO: ModelChangeRequest não existe no schema - precisa ser criado
    // @ts-ignore - Modelo não existe ainda no schema
    const request = await prisma.modelChangeRequest?.create({
      data: {
        userId,
        campo,
        valorAntigo,
        valorNovo: String(valorNovo),
        status: "PENDING",
      },
    });

    return NextResponse.json({ request }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar solicitação:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar solicitação" },
      { status: 500 }
    );
  }
}

