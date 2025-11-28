/**
 * Componente client-side para listagem de ensaios com grid 3 colunas, filtro e paginação
 */

"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import EnsaioCoverClient from "./EnsaioCoverClient";

interface Modelo {
  id: string;
  name: string | null;
  email: string;
  cpf: string | null;
}

interface Projeto {
  id: string;
  name: string;
  slug: string;
}

interface Produto {
  id: string;
  slug: string | null;
  nome: string;
  precoEuro: number | null;
  categoria: string | null;
}

interface Ensaio {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  shootDate: Date | null;
  status: string;
  subjectCpf: string;
  coverImageKey: string | null;
  termPdfKey: string | null;
  syncFolderUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  subject: {
    name: string | null;
    email: string;
    cpf: string | null;
  } | null;
  projetos?: Array<{
    projeto: {
      id: string;
      name: string;
      active: boolean;
    };
  }>;
  produtos?: Array<{
    produto: {
      id: string;
      slug: string | null;
      nome: string;
      precoEuro: number | null;
      categoria: string | null;
    };
  }>;
}

interface EnsaiosListClientProps {
  ensaios: Ensaio[];
  modelos: Modelo[];
  projetos: Projeto[];
  produtos: Produto[];
  currentPage: number;
  totalPages: number;
  totalEnsaios: number;
  canEdit: boolean;
  searchParams?: {
    modeloId?: string;
    projetoId?: string;
    produtoId?: string;
    status?: string;
  };
}

export default function EnsaiosListClient({
  ensaios,
  modelos,
  projetos,
  produtos,
  currentPage,
  totalPages,
  totalEnsaios,
  canEdit,
  searchParams: initialSearchParams,
}: EnsaiosListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modeloFilter, setModeloFilter] = useState<string>(
    initialSearchParams?.modeloId || searchParams.get("modeloId") || ""
  );
  const [projetoFilter, setProjetoFilter] = useState<string>(
    initialSearchParams?.projetoId || searchParams.get("projetoId") || ""
  );
  const [produtoFilter, setProdutoFilter] = useState<string>(
    initialSearchParams?.produtoId || searchParams.get("produtoId") || ""
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    initialSearchParams?.status || searchParams.get("status") || ""
  );

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

  // Handler de filtros
  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    params.set("page", "1"); // Reset para primeira página ao filtrar
    router.push(`/arquiteto/ensaios?${params.toString()}`);
  };

  const handleModeloFilterChange = (modeloCpf: string) => {
    setModeloFilter(modeloCpf);
    updateFilters({ modeloId: modeloCpf });
  };

  const handleProjetoFilterChange = (projetoId: string) => {
    setProjetoFilter(projetoId);
    updateFilters({ projetoId });
  };

  const handleProdutoFilterChange = (produtoId: string) => {
    setProdutoFilter(produtoId);
    updateFilters({ produtoId });
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    updateFilters({ status });
  };

  return (
    <div>
      {/* Filtros */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
          padding: "1.5rem",
          background: "#f9fafb",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: "0.5rem", color: "#111827" }}>
            Modelo:
          </label>
          <select
            value={modeloFilter}
            onChange={(e) => handleModeloFilterChange(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 14,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="">Todos</option>
            {modelos.map((modelo) => (
              <option key={modelo.id} value={modelo.cpf || ""}>
                {modelo.name || modelo.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: "0.5rem", color: "#111827" }}>
            Projeto:
          </label>
          <select
            value={projetoFilter}
            onChange={(e) => handleProjetoFilterChange(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 14,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="">Todos</option>
            {projetos.map((projeto) => (
              <option key={projeto.id} value={projeto.id}>
                {projeto.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: "0.5rem", color: "#111827" }}>
            Produto:
          </label>
          <select
            value={produtoFilter}
            onChange={(e) => handleProdutoFilterChange(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 14,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="">Todos</option>
            {produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>
                {produto.nome} {(!produto.precoEuro || produto.categoria === "Cortesia") ? "(Cortesia)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: "0.5rem", color: "#111827" }}>
            Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 14,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="">Todos</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="DRAFT">Rascunho</option>
          </select>
        </div>
      </div>

      {/* Listagem em grid 3 colunas (responsivo) */}
      {ensaios.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: "3rem 2rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 16, color: "#6b7280", marginBottom: "0.5rem" }}>
            Nenhum ensaio encontrado.
          </p>
          <p style={{ fontSize: 14, color: "#9ca3af" }}>
            {modeloFilter
              ? "Tente selecionar outro modelo ou limpar o filtro."
              : "Crie seu primeiro ensaio acima."}
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            {ensaios.map((ensaio) => (
              <div
                key={ensaio.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  overflow: "hidden",
                  backgroundColor: "#ffffff",
                  transition: "box-shadow 0.2s",
                  display: "flex",
                  flexDirection: "column",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Miniatura da capa */}
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    background: "#f9fafb",
                    position: "relative",
                  }}
                >
                  <EnsaioCoverClient ensaioId={ensaio.id} title={ensaio.title} />
                </div>

                {/* Conteúdo do card */}
                <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <h3
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          margin: 0,
                          color: "#111827",
                          flex: 1,
                        }}
                      >
                        {ensaio.title}
                      </h3>
                      <span
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor:
                            ensaio.status === "PUBLISHED"
                              ? "#dcfce7"
                              : "#fef3c7",
                          color:
                            ensaio.status === "PUBLISHED"
                              ? "#166534"
                              : "#92400e",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                          marginLeft: "0.5rem",
                        }}
                      >
                        {ensaio.status}
                      </span>
                    </div>
                    {ensaio.description && (
                      <p
                        style={{
                          color: "#6b7280",
                          fontSize: 14,
                          marginBottom: "0.5rem",
                          lineHeight: 1.5,
                        }}
                      >
                        {ensaio.description.length > 100
                          ? `${ensaio.description.substring(0, 100)}...`
                          : ensaio.description}
                      </p>
                    )}
                  </div>

                  {/* Selos de Projetos e Produtos */}
                  {(ensaio.projetos && ensaio.projetos.length > 0) || (ensaio.produtos && ensaio.produtos.length > 0) ? (
                    <div style={{ marginBottom: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {ensaio.projetos && ensaio.projetos.length > 0 && (
                        <>
                          {ensaio.projetos.map((ep) => (
                            <span
                              key={ep.projeto.id}
                              style={{
                                padding: "0.25rem 0.5rem",
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                backgroundColor: "#dbeafe",
                                color: "#1e40af",
                              }}
                            >
                              📁 {ep.projeto.name}
                            </span>
                          ))}
                        </>
                      )}
                      {ensaio.produtos && ensaio.produtos.length > 0 && (
                        <>
                          {ensaio.produtos.map((ep) => (
                            <span
                              key={ep.produto.id}
                              style={{
                                padding: "0.25rem 0.5rem",
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                backgroundColor: (!ep.produto.precoEuro || ep.produto.categoria === "Cortesia") ? "#fef3c7" : "#dcfce7",
                                color: (!ep.produto.precoEuro || ep.produto.categoria === "Cortesia") ? "#92400e" : "#166534",
                              }}
                            >
                              {(!ep.produto.precoEuro || ep.produto.categoria === "Cortesia") ? "🔥" : "📦"} {ep.produto.nome}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  ) : null}

                  {/* Metadados */}
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: "1rem", flex: 1 }}>
                    <p style={{ marginBottom: "0.25rem" }}>
                      <strong style={{ color: "#111827" }}>Modelo:</strong>{" "}
                      {ensaio.subject?.name || ensaio.subject?.email || formatCpf(ensaio.subjectCpf)}
                    </p>
                    {ensaio.shootDate && (
                      <p style={{ marginBottom: "0.25rem" }}>
                        <strong style={{ color: "#111827" }}>Data:</strong> {formatDate(ensaio.shootDate)}
                      </p>
                    )}
                    {/* Badge de termo */}
                    <div style={{ marginTop: "0.5rem" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.25rem 0.5rem",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 500,
                          backgroundColor: ensaio.termPdfKey ? "#dcfce7" : "#fef3c7",
                          color: ensaio.termPdfKey ? "#166534" : "#92400e",
                        }}
                      >
                        {ensaio.termPdfKey ? "✓ Termo OK" : "⚠ Termo pendente"}
                      </span>
                    </div>
                  </div>

                  {/* Botão Abrir Ensaio */}
                  <Link
                    href={`/arquiteto/ensaios/${ensaio.id}`}
                    style={{
                      display: "block",
                      padding: "0.65rem 1rem",
                      background: "#111827",
                      color: "#fff",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: 500,
                      textAlign: "center",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#374151";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#111827";
                    }}
                  >
                    Abrir Ensaio →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "1rem",
                padding: "1.5rem",
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
              }}
            >
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", Math.max(1, currentPage - 1).toString());
                  router.push(`/arquiteto/ensaios?${params.toString()}`);
                }}
                disabled={currentPage === 1}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: currentPage === 1 ? "#f3f4f6" : "#fff",
                  color: currentPage === 1 ? "#9ca3af" : "#111827",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: 14, color: "#6b7280" }}>
                Página {currentPage} de {totalPages} ({totalEnsaios} ensaios)
              </span>
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", Math.min(totalPages, currentPage + 1).toString());
                  router.push(`/arquiteto/ensaios?${params.toString()}`);
                }}
                disabled={currentPage === totalPages}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: currentPage === totalPages ? "#f3f4f6" : "#fff",
                  color: currentPage === totalPages ? "#9ca3af" : "#111827",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

