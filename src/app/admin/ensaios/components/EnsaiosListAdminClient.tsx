/**
 * Componente client-side para listagem de ensaios (ADMIN/ARQUITETO)
 * ADMIN: somente leitura
 * ARQUITETO: pode editar
 */

"use client";

import Link from "next/link";
import EnsaioCoverClient from "@/app/arquiteto/ensaios/components/EnsaioCoverClient";

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
  subject: {
    name: string | null;
    email: string;
    cpf: string | null;
  } | null;
}

interface EnsaiosListAdminClientProps {
  ensaios: Ensaio[];
  canEdit: boolean;
}

export default function EnsaiosListAdminClient({ ensaios, canEdit }: EnsaiosListAdminClientProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCpf = (cpf: string | null) => {
    if (!cpf) return "—";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
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
          Nenhum ensaio encontrado.
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

            {/* Metadados */}
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: "1rem", flex: 1 }}>
              <p style={{ marginBottom: "0.25rem" }}>
                <strong style={{ color: "#111827" }}>Modelo:</strong>{" "}
                {ensaio.subject?.name || ensaio.subject?.email || formatCpf(ensaio.subject?.cpf || null)}
              </p>
              {ensaio.shootDate && (
                <p style={{ marginBottom: "0.25rem" }}>
                  <strong style={{ color: "#111827" }}>Data:</strong> {formatDate(ensaio.shootDate)}
                </p>
              )}
            </div>

            {/* Botão Abrir Ensaio */}
            <Link
              href={canEdit ? `/arquiteto/ensaios/${ensaio.id}` : `/admin/ensaios/${ensaio.id}`}
              style={{
                display: "block",
                padding: "0.65rem 1rem",
                background: canEdit ? "var(--color-gold-primary)" : "#6b7280",
                color: "#fff",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                textAlign: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = canEdit ? "var(--color-gold-bright)" : "#4b5563";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = canEdit ? "var(--color-gold-primary)" : "#6b7280";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {canEdit ? "Editar Ensaio →" : "Ver Ensaio →"}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

