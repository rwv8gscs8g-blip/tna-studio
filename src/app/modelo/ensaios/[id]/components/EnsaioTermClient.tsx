/**
 * Componente client-side para exibir link do termo PDF com URL assinada efêmera.
 */

"use client";

import { useEffect, useState } from "react";

interface EnsaioTermClientProps {
  ensaioId: string;
}

export default function EnsaioTermClient({ ensaioId }: EnsaioTermClientProps) {
  const [termUrl, setTermUrl] = useState<string | null>(null);
  const [d4signUrl, setD4signUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Buscar dados do ensaio para verificar se tem D4Sign ou termo PDF
    fetch(`/api/modelo/ensaios/${ensaioId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erro ${res.status}`);
        }
        return res.json();
      })
      .then(async (ensaioData) => {
        // Prioridade 1: D4Sign (se existir)
        if (ensaioData.d4signDocumentId) {
          setD4signUrl(ensaioData.d4signDocumentId);
          setLoading(false);
          return;
        }

        // Prioridade 2: Termo PDF local (se existir)
        if (ensaioData.termPdfKey) {
          try {
            const termRes = await fetch(`/api/ensaios/${ensaioId}/term`);
            if (termRes.ok) {
              const termData = await termRes.json();
              if (termData.signedUrl) {
                setTermUrl(termData.signedUrl);
              }
            }
          } catch (err) {
            console.error("[EnsaioTermClient] Erro ao buscar term PDF:", err);
          }
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("[EnsaioTermClient] Erro ao buscar dados do ensaio:", err);
        setLoading(false);
      });
  }, [ensaioId]);

  if (loading) {
    return (
      <p style={{ color: "#9ca3af", fontSize: 14 }}>
        Verificando termo...
      </p>
    );
  }

  if (error || (!termUrl && !d4signUrl)) {
    return (
      <p style={{ color: "#9ca3af", fontSize: 14 }}>
        Termo ainda não disponível
      </p>
    );
  }

  // Prioridade: D4Sign primeiro, depois PDF local
  if (d4signUrl) {
    return (
      <a
        href={d4signUrl}
        target="_blank"
        rel="noopener noreferrer"
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
        📄 Ver Termo de Autorização no D4Sign
      </a>
    );
  }

  if (termUrl) {
    return (
      <a
        href={termUrl}
        target="_blank"
        rel="noopener noreferrer"
        download
        style={{
          display: "inline-block",
          padding: "0.75rem 1.5rem",
          background: "#dc2626",
          color: "#fff",
          borderRadius: 8,
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        📄 Baixar Termo (PDF)
      </a>
    );
  }

  return null;
}

