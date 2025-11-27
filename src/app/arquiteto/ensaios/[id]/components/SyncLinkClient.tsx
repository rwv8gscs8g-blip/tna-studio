/**
 * Componente client-side para exibir link do Sync.com (MUITO SENSÍVEL).
 * 
 * IMPORTANTE: Apenas ARQUITETO e ADMIN podem acessar via API protegida.
 */

"use client";

import { useEffect, useState } from "react";

interface SyncLinkClientProps {
  ensaioId: string;
}

export default function SyncLinkClient({ ensaioId }: SyncLinkClientProps) {
  const [syncUrl, setSyncUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Buscar sync link via API protegida
    fetch(`/api/ensaios/${ensaioId}/sync-link`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            // Sem sync link - não é erro
            setSyncUrl(null);
            return null;
          }
          throw new Error(`Erro ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        setSyncUrl(data.syncUrl || null);
      })
      .catch((err) => {
        console.error("[SyncLinkClient] Erro ao buscar sync link:", err);
        // Sync link não encontrado não é erro fatal
        setSyncUrl(null);
      })
      .finally(() => setLoading(false));
  }, [ensaioId]);

  if (loading) {
    return null; // Não mostra nada enquanto carrega
  }

  if (error || !syncUrl) {
    return null; // Não mostra nada se não houver sync link
  }

  return (
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
        Link completo (Sync.com)
      </h2>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: "1rem" }}>
        Pasta completa do ensaio no Sync.com com todas as fotos e materiais.
      </p>
      <div
        style={{
          padding: "0.75rem",
          background: "#fef3c7",
          border: "1px solid #fbbf24",
          borderRadius: 8,
          marginBottom: "1rem",
          fontSize: 13,
          color: "#92400e",
        }}
      >
        <strong>⚠️ Segurança:</strong> O link do Sync.com é sensível. Use apenas para visualização interna ou edição controlada.
      </div>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <a
          href={`/ensaios/${ensaioId}/sync-preview`}
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            background: "#2563eb",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          🔒 Visualizar no TNA-Studio (Seguro)
        </a>
        <button
          type="button"
          onClick={() => {
            // Copiar URL para área de transferência (apenas para ARQUITETO/ADMIN)
            if (syncUrl) {
              navigator.clipboard.writeText(syncUrl).then(() => {
                alert("Link copiado para área de transferência.");
              }).catch(() => {
                alert("Erro ao copiar link.");
              });
            }
          }}
          style={{
            padding: "0.75rem 1.5rem",
            background: "#6b7280",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          📋 Copiar Link (Uso Administrativo)
        </button>
      </div>
      <div
        style={{
          marginTop: "1rem",
          padding: "0.75rem",
          background: "#f3f4f6",
          borderRadius: 6,
          fontSize: 12,
          color: "#6b7280",
          fontFamily: "monospace",
          wordBreak: "break-all",
          maxHeight: "60px",
          overflow: "auto",
        }}
      >
        {syncUrl ? `${syncUrl.substring(0, 60)}...` : "—"}
      </div>
    </div>
  );
}

