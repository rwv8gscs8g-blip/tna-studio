import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH: Aprovar ou rejeitar solicitação (apenas ARQUITETO)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userRole = (session.user as any)?.role as Role;
    const userId = (session.user as any)?.id;
    
    // Apenas ARQUITETO pode aprovar/rejeitar
    if (userRole !== "ARQUITETO") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, motivoRejeicao } = body; // action: "approve" ou "reject"

    if (!action || (action !== "approve" && action !== "reject")) {
      return NextResponse.json(
        { error: "Ação inválida. Use 'approve' ou 'reject'" },
        { status: 400 }
      );
    }

    // TODO: ModelChangeRequest não existe no schema - precisa ser criado
    // Buscar solicitação
    // @ts-ignore - Modelo não existe ainda no schema
    const request = await prisma.modelChangeRequest?.findUnique({
      where: { id },
      include: {
        User: true,
      },
    }).catch(() => null);

    if (!request) {
      return NextResponse.json({ 
        error: "Funcionalidade temporariamente desabilitada: ModelChangeRequest não existe no schema" 
      }, { status: 501 });
    }

    if (request.status !== "PENDING") {
      return NextResponse.json(
        { error: "Solicitação já foi processada" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Aprovar: atualizar campo do usuário e criar registro de auditoria
      const updateData: any = {};
      updateData[request.campo] = request.valorNovo;

      // Atualizar usuário
      await prisma.user.update({
        where: { id: request.userId },
        data: updateData,
      });

      // Criar registro de auditoria
      // @ts-ignore - Modelo não existe ainda no schema
      await prisma.modelAuditHistory?.create({
        data: {
          userId: request.userId,
          campo: request.campo,
          valorAntes: request.valorAntigo,
          valorDepois: request.valorNovo,
          aprovadoPor: userId,
        },
      }).catch(() => {});

      // Atualizar solicitação
      // @ts-ignore - Modelo não existe ainda no schema
      await prisma.modelChangeRequest?.update({
        where: { id },
        data: {
          status: "APPROVED",
          aprovadoPor: userId,
        },
      });

      return NextResponse.json({ ok: true, message: "Solicitação aprovada" });
    } else {
      // Rejeitar
      if (!motivoRejeicao) {
        return NextResponse.json(
          { error: "Motivo da rejeição é obrigatório" },
          { status: 400 }
        );
      }

      // @ts-ignore - Modelo não existe ainda no schema
      await prisma.modelChangeRequest?.update({
        where: { id },
        data: {
          status: "REJECTED",
          aprovadoPor: userId,
          motivoRejeicao,
        },
      }).catch(() => {});

      return NextResponse.json({ ok: true, message: "Solicitação rejeitada" });
    }
  } catch (error: any) {
    console.error("Erro ao processar solicitação:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}

