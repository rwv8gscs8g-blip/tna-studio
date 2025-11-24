import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SyncPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any)?.role as Role;
  if (userRole !== Role.ARQUITETO && userRole !== Role.ADMIN) {
    redirect("/");
  }

  const { id } = await params;
  const ensaio = await prisma.ensaio.findUnique({
    where: { id },
    select: { id: true, syncFolderUrl: true, title: true },
  });

  if (!ensaio) {
    notFound();
  }

  if (!ensaio.syncFolderUrl) {
    return (
      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "2rem",
            border: "1px solid #e5e7eb",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: "1rem" }}>
            Link Sync.com não disponível
          </h1>
          <p style={{ color: "#6b7280" }}>
            Este ensaio ainda não possui um link do Sync.com configurado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "1.5rem",
          border: "1px solid #e5e7eb",
          marginBottom: "1rem",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: "0.5rem" }}>
          Acesso ao Sync.com - {ensaio.title}
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14 }}>
          Os arquivos em alta resolução ficam exclusivamente disponíveis no Sync.com que a modelo escolheu no momento da sessão.
        </p>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          height: "calc(100vh - 300px)",
          minHeight: "600px",
        }}
      >
        <iframe
          src={ensaio.syncFolderUrl}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
          title="Sync.com - Pasta do Ensaio"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  );
}



