import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SyncPreviewPage({ params }: PageProps) {
  const session = await auth();
  
  // Proteção robusta: verificar sessão
  if (!session || !session.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any)?.role as Role;
  const userId = (session.user as any)?.id;
  const { id } = await params;

  // Buscar ensaio com informações necessárias
  const ensaio = await prisma.ensaio.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      syncFolderUrl: true,
      subjectCpf: true,
      createdById: true,
      status: true,
      deletedAt: true,
    },
  });

  if (!ensaio || ensaio.deletedAt) {
    notFound();
  }

  // Verificar permissões de acesso
  let hasAccess = false;

  if (userRole === Role.ARQUITETO || userRole === Role.ADMIN || userRole === Role.SUPERADMIN) {
    // ARQUITETO/ADMIN/SUPERADMIN podem ver todos os ensaios
    hasAccess = true;
  } else if (userRole === Role.MODELO || userRole === Role.CLIENTE) {
    // MODELO/CLIENTE só podem ver ensaios próprios e publicados
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { cpf: true },
    });
    
    if (user?.cpf && ensaio.subjectCpf === user.cpf && ensaio.status === "PUBLISHED") {
      hasAccess = true;
    }
  }

  if (!hasAccess) {
    redirect("/");
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
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            Este ensaio ainda não possui um link do Sync.com configurado.
          </p>
          <Link
            href={
              userRole === Role.MODELO 
                ? `/modelo/ensaios/${id}` 
                : userRole === Role.CLIENTE
                ? `/` // CLIENTE não tem página de ensaios ainda, redireciona para home
                : `/arquiteto/ensaios/${id}`
            }
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              background: "#111827",
              color: "#fff",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Voltar ao Ensaio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <header
        style={{
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: "0.5rem" }}>
            Ensaio Completo em Alta Resolução
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            {ensaio.title}
          </p>
        </div>
        <Link
          href={
            userRole === Role.MODELO 
              ? `/modelo/ensaios/${id}` 
              : userRole === Role.CLIENTE
              ? `/` // CLIENTE não tem página de ensaios ainda, redireciona para home
              : `/arquiteto/ensaios/${id}`
          }
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            background: "#111827",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ← Voltar ao Ensaio
        </Link>
      </header>

      <div
        style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 8,
          padding: "1rem",
          marginBottom: "1rem",
          fontSize: 14,
          color: "#065f46",
        }}
      >
        <strong>🔒 Acesso Seguro:</strong> Você está visualizando o conteúdo do Sync.com dentro do TNA-Studio, 
        protegido pela sua sessão autenticada. O link não é exposto diretamente.
      </div>

      {/* Iframe sandbox para carregar o Sync.com de forma segura */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          height: "calc(100vh - 250px)",
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
          title="Sync.com - Conteúdo do Ensaio"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
          allow="downloads"
        />
      </div>
    </div>
  );
}

