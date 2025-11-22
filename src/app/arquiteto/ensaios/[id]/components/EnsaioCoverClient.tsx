/**
 * Componente client-side para exibir foto de capa do ensaio com URL assinada efêmera.
 */

"use client";

import { useEffect, useState } from "react";

interface EnsaioCoverClientProps {
  ensaioId: string;
  title: string;
}

export default function EnsaioCoverClient({ ensaioId, title }: EnsaioCoverClientProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Buscar cover via API protegida
    fetch(`/api/ensaios/${ensaioId}/cover`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            // Sem cover - não é erro
            setCoverUrl(null);
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
        setCoverUrl(data.signedUrl || null);
      })
      .catch((err) => {
        console.error("[EnsaioCoverClient] Erro ao buscar cover:", err);
        // Cover não encontrado não é erro fatal
        setCoverUrl(null);
      })
      .finally(() => setLoading(false));
  }, [ensaioId]);

  if (loading) {
    return null; // Não mostra nada enquanto carrega
  }

  if (error || !coverUrl) {
    return null; // Não mostra nada se não houver cover
  }

  return (
    <div
      style={{
        marginBottom: "2rem",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
      }}
    >
      <img
        src={coverUrl}
        alt={`Capa: ${title}`}
        style={{
          width: "100%",
          height: "auto",
          maxHeight: "500px",
          objectFit: "cover",
          display: "block",
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}

