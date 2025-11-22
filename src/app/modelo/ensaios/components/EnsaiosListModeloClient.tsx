/**
 * Componente client-side para listagem de ensaios da MODELO (somente leitura, grid 3 colunas)
 */

"use client";

import Link from "next/link";
import EnsaioCoverClient from "./EnsaioCoverClient";

interface Ensaio {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  shootDate: Date | null;
  status: string;
  coverImageKey: string | null;
  termPdfKey: string | null;
  createdAt: Date;
  createdBy: {
    name: string | null;
    email: string;
  } | null;
}

interface EnsaiosListModeloClientProps {
  ensaios: Ensaio[];
}

export default function EnsaiosListModeloClient({ ensaios }: EnsaiosListModeloClientProps) {
  // Formatar data para exibição
  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (ensaios.length === 0) {
    return (
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
          Ainda não há ensaios publicados associados ao seu cadastro.
        </p>
        <p style={{ fontSize: 14, color: "#9ca3af" }}>
          Assim que o Arquiteto vincular seu ensaio, ele aparecerá aqui.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "1.5rem",
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
          <Link
            href={`/modelo/ensaios/${ensaio.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
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
          </Link>

          {/* Conteúdo do card */}
          <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
            <Link
              href={`/modelo/ensaios/${ensaio.id}`}
              style={{ textDecoration: "none", color: "inherit", flex: 1, display: "flex", flexDirection: "column" }}
            >
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
                      backgroundColor: "#dcfce7",
                      color: "#166534",
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

              {/* Metadados */}
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: "1rem", flex: 1 }}>
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
            </Link>

            {/* Botão Ver Ensaio */}
            <Link
              href={`/modelo/ensaios/${ensaio.id}`}
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
              Ver Ensaio →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

