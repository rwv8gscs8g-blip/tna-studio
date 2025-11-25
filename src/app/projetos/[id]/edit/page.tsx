import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import EditProjetoForm from "./components/EditProjetoForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjetoPage({ params }: PageProps) {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any)?.role;

  if (userRole !== "ARQUITETO" && userRole !== "ADMIN")) {
    redirect("/signin");
  }

  const { id } = await params;
  const projeto = await prisma.projeto.findUnique({
    where: { id },
  });

  if (!projeto) {
    notFound();
  }

  const canEdit = userRole === "ARQUITETO";

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <p style={{ fontSize: 12, letterSpacing: 1, color: "#9ca3af" }}>
          Gerenciamento de Projetos
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: "0.5rem" }}>
          Editar Projeto
        </h1>
      </header>

      {!canEdit && (
        <div
          style={{
            padding: "1rem",
            background: "#f3f4f6",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            marginBottom: "2rem",
            fontSize: 14,
            color: "#6b7280",
          }}
        >
          <strong>Somente leitura:</strong> Você pode visualizar, mas não pode editar projetos.
        </div>
      )}

      <EditProjetoForm projeto={projeto} canEdit={canEdit} />
    </div>
  );
}
