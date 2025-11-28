/**
 * Página de Ensaios para ADMIN (somente leitura)
 * ADMIN pode visualizar todos os ensaios, mas não pode criar/editar/excluir
 */

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import EnsaiosListAdminClient from "./components/EnsaiosListAdminClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminEnsaiosPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any)?.role as Role;
  
  // Apenas ADMIN e ARQUITETO podem acessar
  if (userRole !== Role.ADMIN && userRole !== Role.ARQUITETO) {
    redirect("/signin");
  }

  // Buscar todos os ensaios não deletados (ADMIN vê todos, ARQUITETO vê os seus)
  const ensaios = await prisma.ensaio.findMany({
    where: {
      deletedAt: null,
      ...(userRole === Role.ARQUITETO ? {
        createdById: (session.user as any)?.id,
      } : {}),
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
      createdAt: true,
      subject: {
        select: {
          name: true,
          email: true,
          cpf: true,
        },
      },
    },
    orderBy: [
      { shootDate: "desc" },
      { createdAt: "desc" },
    ],
    take: 100, // Limitar a 100 ensaios para performance
  });

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <p style={{ fontSize: 12, letterSpacing: 1, color: "#9ca3af" }}>
          Visualização de Ensaios
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: "0.5rem", fontFamily: "var(--font-serif)" }}>
          Ensaios Fotográficos
        </h1>
        <p style={{ color: "#6b7280" }}>
          {userRole === Role.ADMIN 
            ? "Visualização somente leitura de todos os ensaios cadastrados."
            : "Seus ensaios fotográficos"}
        </p>
      </header>

      {/* Banner informativo para ADMIN */}
      {userRole === Role.ADMIN && (
        <div
          style={{
            padding: "1rem",
            background: "#fef3c7",
            border: "1px solid #fbbf24",
            borderRadius: 8,
            marginBottom: "1.5rem",
            fontSize: 14,
            color: "#92400e",
          }}
        >
          <strong>ℹ️ Modo somente leitura:</strong> Como ADMIN, você pode visualizar todos os ensaios, 
          mas não pode criar, editar ou excluir. Para fazer alterações, é necessário estar logado como ARQUITETO.
        </div>
      )}

      <EnsaiosListAdminClient ensaios={ensaios} canEdit={userRole === Role.ARQUITETO} />
    </div>
  );
}

