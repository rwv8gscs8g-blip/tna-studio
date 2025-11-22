import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isArquitetoSessionReadOnly } from "@/lib/arquiteto-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    console.log("[API] POST /api/arquiteto/ensaios - Iniciando criação de ensaio");
    
    // Verificar sessão
    const session = await auth();
    console.log("[API] Sessão obtida:", session ? "sim" : "não");
    
    if (!session || !session.user) {
      console.error("[API] Erro: Não autenticado");
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    // Verificar role ARQUITETO
    const userRole = (session.user as any)?.role;
    console.log("[API] Role do usuário:", userRole);
    
    if (userRole !== "ARQUITETO" && userRole !== "ADMIN") {
      console.error("[API] Erro: Acesso negado. Role:", userRole);
      return NextResponse.json(
        { error: "Acesso negado. Apenas ARQUITETO ou ADMIN pode criar ensaios." },
        { status: 403 }
      );
    }

    const userId = (session.user as any)?.id;
    
    // Verificar se está em modo somente leitura
    const sessionId = (session as any)?.arquitetoSessionId;
    if (sessionId) {
      const isReadOnly = await isArquitetoSessionReadOnly(userId, sessionId);
      if (isReadOnly) {
        return NextResponse.json(
          { error: "Sessão em modo somente leitura. Existe outra sessão ativa mais recente. Faça login novamente para retomar os poderes de edição." },
          { status: 403 }
        );
      }
    }
    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário não encontrado." },
        { status: 400 }
      );
    }

    // Ler dados do corpo da requisição
    const { title, slug, description, shootDate, status, subjectCpf, coverImageKey, termPdfKey, syncFolderUrl, projetoIds, produtoIds, miniGalleryKeys } = await req.json();

    // Validação básica
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Título é obrigatório." },
        { status: 400 }
      );
    }

    if (!slug || !slug.trim()) {
      return NextResponse.json(
        { error: "Slug é obrigatório." },
        { status: 400 }
      );
    }

    // Validação de subjectCpf (obrigatório)
    if (!subjectCpf || typeof subjectCpf !== "string") {
      return NextResponse.json(
        { error: "CPF do modelo ou cliente é obrigatório." },
        { status: 400 }
      );
    }

    // Normalizar CPF (remover pontos/traços)
    const normalizedCpf = subjectCpf.replace(/\D/g, "");
    if (normalizedCpf.length !== 11) {
      return NextResponse.json(
        { error: "CPF inválido. Deve ter 11 dígitos." },
        { status: 400 }
      );
    }

    // Buscar usuário com este CPF
    const subjectUser = await prisma.user.findUnique({
      where: { cpf: normalizedCpf },
      select: { id: true, role: true, name: true },
    });

    if (!subjectUser) {
      return NextResponse.json(
        { error: "Não foi encontrado usuário com este CPF." },
        { status: 404 }
      );
    }

    // Validar que o usuário é MODELO ou CLIENTE
    if (subjectUser.role !== "MODELO" && subjectUser.role !== "CLIENTE") {
      return NextResponse.json(
        { error: `O usuário com CPF ${normalizedCpf} não é MODELO ou CLIENTE. Role atual: ${subjectUser.role}` },
        { status: 403 }
      );
    }

    // Verificar se o slug já existe
    const existingEnsaio = await prisma.ensaio.findUnique({
      where: { slug: slug.trim() },
    });

    if (existingEnsaio) {
      return NextResponse.json(
        { error: "Já existe um ensaio com este slug." },
        { status: 400 }
      );
    }

    // Criar ensaio com projetos, produtos e mini-galeria associados
    const ensaio = await prisma.ensaio.create({
      data: {
        title: title.trim(),
        slug: slug.trim(),
        description: description?.trim() || null,
        shootDate: shootDate ? new Date(shootDate) : null,
        status: status || "PUBLISHED",
        createdById: userId,
        subjectCpf: normalizedCpf,
        coverImageKey: coverImageKey?.trim() || null,
        termPdfKey: termPdfKey?.trim() || null,
        syncFolderUrl: syncFolderUrl?.trim() || null,
        projetos: projetoIds && Array.isArray(projetoIds) && projetoIds.length > 0
          ? {
              create: projetoIds.map((projetoId: string) => ({
                projetoId,
              })),
            }
          : undefined,
        produtos: produtoIds && Array.isArray(produtoIds) && produtoIds.length > 0
          ? {
              create: produtoIds.map((produtoId: string) => ({
                produtoId,
              })),
            }
          : undefined,
        photos: miniGalleryKeys && Array.isArray(miniGalleryKeys) && miniGalleryKeys.length > 0
          ? {
              create: miniGalleryKeys.map((key: string, index: number) => ({
                storageKey: key,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        shootDate: true,
        status: true,
        coverImageKey: true,
        termPdfKey: true,
        syncFolderUrl: true,
        createdAt: true,
        projetos: {
          select: {
            projeto: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        produtos: {
          select: {
            produto: {
              select: {
                id: true,
                nome: true,
                preco: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Ensaio criado com sucesso.", ensaio },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API] Erro ao criar ensaio:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar ensaio." },
      { status: 500 }
    );
  }
}

