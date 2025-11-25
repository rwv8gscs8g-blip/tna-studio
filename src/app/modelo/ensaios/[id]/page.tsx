import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import EnsaioCoverClient from "./components/EnsaioCoverClient";
import EnsaioPhotosClient from "./components/EnsaioPhotosClient";
import EnsaioTermClient from "./components/EnsaioTermClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ModeloEnsaioDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/signin");
  }
  
  // Proteção: apenas MODELO pode acessar
  const userRole = (session.user as any)?.role;
  if (userRole !== "MODELO") {
    redirect("/signin");
  }

  const userId = (session.user as any)?.id;

  // Buscar CPF da MODELO logada
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { cpf: true, name: true },
  });

  if (!user || !user.cpf) {
    redirect("/signin");
  }

  const { id } = await params;

  // Buscar ensaio
  const ensaio = await prisma.ensaio.findUnique({
    where: { id },
    include: {
      photos: {
        orderBy: [
          { sortOrder: "asc" },
          { createdAt: "desc" },
        ],
      },
    },
  });

  if (!ensaio) {
    notFound();
  }

  // Verificar se o ensaio é da MODELO logada e está publicado
  if (ensaio.subjectCpf !== user.cpf) {
    redirect("/modelo/ensaios");
  }

  if (ensaio.status !== "PUBLISHED") {
    redirect("/modelo/ensaios");
  }

  // Formatar CPF para exibição
  const formatCpf = (cpf: string | null) => {
    if (!cpf) return "—";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  // Formatar data para exibição
  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header
        style={{
          marginBottom: "2rem",
        }}
      >
        <Link
          href="/modelo/ensaios"
          style={{
            display: "inline-block",
            fontSize: 14,
            color: "#6b7280",
            textDecoration: "none",
            marginBottom: "0.5rem",
          }}
        >
          ← Voltar para Meus Ensaios
        </Link>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: "0.5rem" }}>
          {ensaio.title}
        </h1>
        {ensaio.description && (
          <p style={{ color: "#6b7280", fontSize: 16 }}>
            {ensaio.description}
          </p>
        )}
      </header>

      {/* Foto de Capa - via API protegida com URL assinada efêmera */}
      <EnsaioCoverClient ensaioId={ensaio.id} title={ensaio.title} />

      {/* Informações do Ensaio */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "1.5rem",
          border: "1px solid #e5e7eb",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem" }}>
          Informações do Ensaio
        </h2>
        <div style={{ display: "grid", gap: "1rem", fontSize: 14 }}>
          <div>
            <strong style={{ color: "#6b7280", display: "block", marginBottom: "0.25rem" }}>
              Nome do Ensaio
            </strong>
            <span style={{ color: "#111827" }}>{ensaio.title}</span>
          </div>
          <div>
            <strong style={{ color: "#6b7280", display: "block", marginBottom: "0.25rem" }}>
              Data do Ensaio
            </strong>
            <span style={{ color: "#111827" }}>{formatDate(ensaio.shootDate)}</span>
          </div>
        </div>
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 8,
            fontSize: 14,
            color: "#065f46",
          }}
        >
          <strong>ℹ️ Informação:</strong> Este ensaio está associado ao seu cadastro (CPF: {formatCpf(user.cpf)}).
        </div>
      </div>

      {/* Termo de Autorização */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "1.5rem",
          border: "1px solid #e5e7eb",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem" }}>
          Termo de Autorização
        </h2>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: "1rem" }}>
          Documento de autorização de uso de imagem para este ensaio.
        </p>
        {/* Termo PDF via API protegida com URL assinada efêmera */}
        <EnsaioTermClient ensaioId={ensaio.id} />
      </div>

      {/* Galeria do Ensaio */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "1.5rem",
          border: "1px solid #e5e7eb",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem" }}>
          Galeria do Ensaio
        </h2>
        
        {/* Mensagens informativas para MODELO */}
        <div
          style={{
            padding: "1rem",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 8,
            marginBottom: "1rem",
            fontSize: 14,
            color: "#065f46",
          }}
        >
          <p style={{ marginBottom: "0.5rem" }}>
            <strong>ℹ️ Informação:</strong> As 30 fotos exibidas aqui são apenas uma prévia.
          </p>
          <p style={{ marginBottom: "0.5rem" }}>
            O ensaio completo está disponível em alta resolução no link seguro do Sync.com.
          </p>
          <p>
            O contrato assinado está disponível em PDF acima.
          </p>
        </div>
        
        {/* Fotos via API protegida com URLs assinadas efêmeras */}
        <EnsaioPhotosClient ensaioId={ensaio.id} />
      </div>

      {/* Link para Sync.com (apenas para MODELO ver, não editar) */}
      {ensaio.syncFolderUrl && (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "1.5rem",
            border: "1px solid #e5e7eb",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem" }}>
            Ensaio Completo em Alta Resolução
          </h2>
          <p style={{ color: "#6b7280", fontSize: 14, marginBottom: "1rem" }}>
            Os arquivos completos em alta resolução ficam armazenados de forma segura no Sync.com, diferente da senha deste sistema.
          </p>
          <a
            href={ensaio.syncFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
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
            Baixar ensaio completo em alta resolução no Sync.com →
          </a>
        </div>
      )}
    </div>
  );
}

