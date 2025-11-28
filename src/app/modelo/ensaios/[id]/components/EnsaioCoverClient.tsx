/**
 * Componente client-side para exibir foto de capa do ensaio (MODELO) com URL assinada efêmera.
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
    fetch(`/api/ensaios/${ensaioId}/cover`, {
      credentials: "include",
    })
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
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
          color: "#9ca3af",
          fontSize: 14,
        }}
      >
        Carregando capa...
      </div>
    );
  }

  if (error || !coverUrl) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
          color: "#9ca3af",
          fontSize: 14,
        }}
      >
        Sem capa definida
      </div>
    );
  }

  return (
    <img
      src={coverUrl}
      alt={`Capa: ${title}`}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = "none";
        const parent = target.parentElement;
        if (parent) {
          parent.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #9ca3af; font-size: 14px;">Sem capa</div>`;
        }
      }}
    />
  );
}

