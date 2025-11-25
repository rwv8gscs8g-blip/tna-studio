import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import EnsaioCoverClient from "./components/EnsaioCoverClient";
import EnsaioPhotosClient from "./components/EnsaioPhotosClient";
import EnsaioTermClient from "./components/EnsaioTermClient";
import SyncLinkClient from "./components/SyncLinkClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ArquitetoEnsaioDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any)?.role;
  
  // Proteção: apenas ARQUITETO ou ADMIN pode acessar
  if (userRole !== "ARQUITETO" && userRole !== "ADMIN")) {
    redirect("/signin");
  }

  const userId = (session.user as any)?.id;
  const { id } = await params;

  // Verificar se está em modo somente leitura (apenas para ARQUITETO)
  const isReadOnlyArquiteto = userRole === "ARQUITETO" && (session as any)?.isReadOnlyArquiteto === true;
  const canEdit = userRole === "ARQUITETO" && !isReadOnlyArquiteto;

  // Buscar ensaio com todas as informações
  const ensaio = await prisma.ensaio.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      subject: {
        select: {
          id: true,
          name: true,
          email: true,
          cpf: true,
          role: true,
        },
      },
      photos: {
        orderBy: [
          { sortOrder: "asc" },
          { createdAt: "desc" },
        ],
      },
      projetos: {
        select: {
          projeto: {
            select: {
              id: true,
              name: true,
              slug: true,
              active: true,
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
              isTfp: true,
            },
          },
        },
      },
    },
  });

  if (!ensaio) {
    notFound();
  }

  // Verificar permissões
  if (userRole === "ARQUITETO" && ensaio.createdById !== userId) {
    redirect("/arquiteto/ensaios");
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

  // Formatar data para AAAA-MM-DD
  const formatDateISO = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {isReadOnlyArquiteto && (
        <div
          style={{
            padding: "1rem",
            background: "#fef3c7",
            border: "1px solid #fbbf24",
            borderRadius: 8,
            marginBottom: "2rem",
            fontSize: 14,
            color: "#92400e",
          }}
        >
          <strong>⚠️ Modo somente leitura:</strong> Você está em modo somente leitura porque existe outra sessão ativa do Arquiteto. Para retomar os poderes de edição, faça login novamente neste dispositivo.
        </div>
      )}

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "2rem",
        }}
      >
        <div>
          <Link
            href="/arquiteto/ensaios"
            style={{
              display: "inline-block",
              fontSize: 14,
              color: "#6b7280",
              textDecoration: "none",
              marginBottom: "0.5rem",
            }}
          >
            ← Voltar para Ensaios
          </Link>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: "0.5rem" }}>
            {ensaio.title}
          </h1>
          <p style={{ color: "#6b7280", fontSize: 16 }}>
            {ensaio.description || "Sem descrição"}
          </p>
        </div>
        <span
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            backgroundColor:
              ensaio.status === "PUBLISHED"
                ? "#dcfce7"
                : "#fef3c7",
            color:
              ensaio.status === "PUBLISHED"
                ? "#166534"
                : "#92400e",
          }}
        >
          {ensaio.status}
        </span>
      </header>

      {/* Foto de Capa - via API protegida com URL assinada efêmera */}
      <EnsaioCoverClient ensaioId={ensaio.id} title={ensaio.title} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          marginBottom: "2rem",
        }}
      >
        {/* Metadados */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "1.5rem",
            border: "1px solid #e5e7eb",
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
                Nome da Modelo/Cliente
              </strong>
              <span style={{ color: "#111827" }}>
                {ensaio.subject?.name || ensaio.subject?.email || "—"}
              </span>
            </div>
            <div>
              <strong style={{ color: "#6b7280", display: "block", marginBottom: "0.25rem" }}>
                CPF
              </strong>
              <span style={{ color: "#111827" }}>{formatCpf(ensaio.subjectCpf)}</span>
            </div>
            <div>
              <strong style={{ color: "#6b7280", display: "block", marginBottom: "0.25rem" }}>
                Data do Ensaio
              </strong>
              <span style={{ color: "#111827" }}>
                {formatDate(ensaio.shootDate)} ({formatDateISO(ensaio.shootDate)})
              </span>
            </div>
            <div>
              <strong style={{ color: "#6b7280", display: "block", marginBottom: "0.25rem" }}>
                Status
              </strong>
              <span style={{ color: "#111827" }}>{ensaio.status}</span>
            </div>
            <div>
              <strong style={{ color: "#6b7280", display: "block", marginBottom: "0.25rem" }}>
                Criado em
              </strong>
              <span style={{ color: "#111827" }}>
                {new Date(ensaio.createdAt).toLocaleString("pt-BR")}
              </span>
            </div>
            <div>
              <strong style={{ color: "#6b7280", display: "block", marginBottom: "0.25rem" }}>
                Atualizado em
              </strong>
              <span style={{ color: "#111827" }}>
                {new Date(ensaio.updatedAt).toLocaleString("pt-BR")}
              </span>
            </div>
            {ensaio.projetos && ensaio.projetos.length > 0 && (
              <div>
                <strong style={{ color: "#6b7280", display: "block", marginBottom: "0.5rem" }}>
                  Projetos Associados
                </strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {ensaio.projetos.map((ep) => (
                    <span
                      key={ep.projeto.id}
                      style={{
                        padding: "0.5rem 0.75rem",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: ep.projeto.active ? "#dbeafe" : "#f3f4f6",
                        color: ep.projeto.active ? "#1e40af" : "#6b7280",
                      }}
                    >
                      📁 {ep.projeto.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {ensaio.produtos && ensaio.produtos.length > 0 && (
              <div>
                <strong style={{ color: "#6b7280", display: "block", marginBottom: "0.5rem" }}>
                  Produtos Associados
                </strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {ensaio.produtos.map((ep) => (
                    <span
                      key={ep.produto.id}
                      style={{
                        padding: "0.5rem 0.75rem",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: ep.produto.isTfp ? "#fef3c7" : "#dcfce7",
                        color: ep.produto.isTfp ? "#92400e" : "#166534",
                      }}
                    >
                      {ep.produto.isTfp ? "🔥" : "📦"} {ep.produto.nome}
                      {ep.produto.preco > 0 && ` - R$ ${ep.produto.preco.toFixed(2)}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Termo de Autorização */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "1.5rem",
            border: "1px solid #e5e7eb",
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
          
          {/* Botões D4Sign (Em breve) */}
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              disabled
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 6,
                background: "#9ca3af",
                color: "white",
                border: "none",
                fontSize: 13,
                fontWeight: 500,
                cursor: "not-allowed",
              }}
            >
              Gerar contrato no D4Sign (Em breve)
            </button>
            <button
              disabled
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 6,
                background: "#9ca3af",
                color: "white",
                border: "none",
                fontSize: 13,
                fontWeight: 500,
                cursor: "not-allowed",
              }}
            >
              Reenviar assinatura (Em breve)
            </button>
          </div>
        </div>
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
        {/* Fotos via API protegida com URLs assinadas efêmeras */}
        <EnsaioPhotosClient ensaioId={ensaio.id} />
      </div>

      {/* Link completo (Sync.com) - apenas para ARQUITETO e ADMIN - via API protegida */}
      {(userRole === "ARQUITETO" || userRole === "ADMIN") && (
        <SyncLinkClient ensaioId={ensaio.id} />
      )}

      {/* Botão de Editar (apenas ARQUITETO com permissão) */}
      {canEdit && (
        <div style={{ marginTop: "2rem" }}>
          <Link
            href={`/arquiteto/ensaios/${ensaio.id}/edit`}
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
            ✏️ Editar Ensaio
          </Link>
        </div>
      )}
    </div>
  );
}

