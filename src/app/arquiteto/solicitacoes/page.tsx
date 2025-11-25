import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import SolicitacoesClient from "./components/SolicitacoesClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ArquitetoSolicitacoesPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any)?.role as Role;
  
  // Apenas ARQUITETO pode acessar
  if (userRole !== Role.ARQUITETO) {
    redirect("/signin");
  }

  // Buscar solicitações pendentes
  let requests: any[] = [];
  try {
    requests = await prisma.modelChangeRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  } catch (err) {
    console.warn("[Solicitacoes] Erro ao buscar solicitações:", err);
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: "0.5rem" }}>
          Solicitações de Alteração de Dados
        </h1>
        <p style={{ color: "#6b7280" }}>
          Revise e aprove ou rejeite solicitações de alteração de dados das modelos e clientes.
        </p>
      </header>

      <SolicitacoesClient initialRequests={requests || []} />
    </div>
  );
}

