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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Buscar term PDF via API protegida
    fetch(`/api/ensaios/${ensaioId}/term`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            // Sem term - não é erro
            setTermUrl(null);
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
        setTermUrl(data.signedUrl || null);
      })
      .catch((err) => {
        console.error("[EnsaioTermClient] Erro ao buscar term PDF:", err);
        // Term não encontrado não é erro fatal
        setTermUrl(null);
      })
      .finally(() => setLoading(false));
  }, [ensaioId]);

  if (loading) {
    return (
      <p style={{ color: "#9ca3af", fontSize: 14 }}>
        Verificando termo...
      </p>
    );
  }

  if (error || !termUrl) {
    return (
      <p style={{ color: "#9ca3af", fontSize: 14 }}>
        Termo ainda não disponível
      </p>
    );
  }

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

