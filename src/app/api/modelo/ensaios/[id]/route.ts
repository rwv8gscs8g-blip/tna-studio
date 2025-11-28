import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/modelo/ensaios/[id]
 * Obter detalhes de um ensaio (apenas MODELO logada pode ver seus próprios ensaios publicados)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role as Role;
    const userId = (session.user as any)?.id;

    // Apenas MODELO pode acessar
    if (userRole !== Role.MODELO) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas MODELO pode ver ensaios." },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário não encontrado." },
        { status: 400 }
      );
    }

    const { id } = await params;

    // Buscar CPF da MODELO logada (apenas não deletados)
    const user = await prisma.user.findFirst({
      where: { 
        id: userId,
        deletedAt: null, // Apenas usuários não deletados
      },
      select: { cpf: true },
    });

    if (!user || !user.cpf) {
      return NextResponse.json(
        { error: "CPF não encontrado no seu cadastro." },
        { status: 404 }
      );
    }

    // Buscar ensaio (apenas não deletados)
    const ensaio = await prisma.ensaio.findFirst({
      where: { 
        id,
        deletedAt: null, // Apenas ensaios não deletados
      },
      include: {
        photos: {
          where: { deletedAt: null }, // Apenas fotos não deletadas
          orderBy: [
            { sortOrder: "asc" },
            { createdAt: "desc" },
          ],
        },
      },
    });

    if (!ensaio) {
      return NextResponse.json(
        { error: "Ensaio não encontrado." },
        { status: 404 }
      );
    }

    // Normalizar CPFs para comparação (apenas números)
    const userCpfNormalized = user.cpf.replace(/\D/g, "");
    const ensaioCpfNormalized = ensaio.subjectCpf ? ensaio.subjectCpf.replace(/\D/g, "") : "";

    // Verificar se o ensaio é da MODELO logada e está publicado
    if (ensaioCpfNormalized !== userCpfNormalized) {
      return NextResponse.json(
        { error: "Acesso negado. Este ensaio não está associado ao seu cadastro." },
        { status: 403 }
      );
    }

    if (ensaio.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Acesso negado. Este ensaio ainda não foi publicado." },
        { status: 403 }
      );
    }

    // Retornar ensaio sem syncFolderUrl (reservado para ARQUITETO/ADMIN)
    // Incluir d4signDocumentId para o componente de termo
    const ensaioForModelo = {
      id: ensaio.id,
      title: ensaio.title,
      slug: ensaio.slug,
      description: ensaio.description,
      shootDate: ensaio.shootDate,
      status: ensaio.status,
      subjectCpf: ensaio.subjectCpf,
      coverImageKey: ensaio.coverImageKey,
      termPdfKey: ensaio.termPdfKey,
      d4signDocumentId: ensaio.d4signDocumentId, // Incluir para verificação no componente
      createdAt: ensaio.createdAt,
      updatedAt: ensaio.updatedAt,
      photos: ensaio.photos,
      // syncFolderUrl não é exposto para MODELO
    };

    return NextResponse.json(ensaioForModelo);
  } catch (error: any) {
    console.error("[API] Erro ao buscar ensaio:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar ensaio." },
      { status: 500 }
    );
  }
}

