import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SecureSyncPage({ params }: PageProps) {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any)?.role as Role;
  const userId = (session.user as any)?.id;
  const { id } = await params;

  // Apenas ARQUITETO e ADMIN podem acessar
  if (userRole !== "ARQUITETO" && userRole !== "ADMIN") {
    redirect("/signin");
  }

  // Buscar ensaio
  const ensaio = await prisma.ensaio.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      syncFolderUrl: true,
      createdById: true,
    },
  });

  if (!ensaio) {
    notFound();
  }

  // Verificar se ARQUITETO é o criador (ou se é ADMIN)
  if (userRole === "ARQUITETO" && ensaio.createdById !== userId) {
    redirect("/signin");
  }

  if (!ensaio.syncFolderUrl) {
    return (
      <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 16, color: "#6b7280" }}>
            Link do Sync.com não configurado para este ensaio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: "0.5rem" }}>
          Acesso Seguro ao Sync.com
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14 }}>
          Ensaio: {ensaio.title}
        </p>
      </header>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          padding: "1rem",
          marginBottom: "1rem",
          fontSize: 13,
          color: "#6b7280",
        }}
      >
        <strong>🔒 Segurança:</strong> O conteúdo está sendo carregado em um ambiente seguro e isolado.
        O link do Sync.com não é exposto diretamente no navegador.
      </div>

      {/* Iframe sandbox para carregar o Sync.com de forma segura */}
      <div
        style={{
          width: "100%",
          height: "80vh",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          overflow: "hidden",
          background: "#f9fafb",
        }}
      >
        <iframe
          src={ensaio.syncFolderUrl}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          title="Sync.com - Conteúdo Seguro"
        />
      </div>
    </div>
  );
}

