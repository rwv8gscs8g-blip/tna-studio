/**
 * Componente client-side para exibir fotos do ensaio com URLs assinadas efêmeras.
 * 
 * IMPORTANTE: Nunca monta URLs diretas para R2. Sempre usa a API protegida.
 */

"use client";

import { useEffect, useState } from "react";

interface Photo {
  id: string;
  sortOrder: number;
  signedUrl: string;
  createdAt: string;
}

interface EnsaioPhotosClientProps {
  ensaioId: string;
}

export default function EnsaioPhotosClient({ ensaioId }: EnsaioPhotosClientProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Buscar fotos via API protegida (com URLs assinadas)
    fetch(`/api/ensaios/${ensaioId}/photos`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error("Acesso negado");
          }
          throw new Error(`Erro ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setPhotos(data.photos || []);
      })
      .catch((err) => {
        console.error("[EnsaioPhotosClient] Erro ao buscar fotos:", err);
        setError(err.message || "Erro ao carregar fotos");
      })
      .finally(() => setLoading(false));
  }, [ensaioId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
        Carregando fotos...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "1rem", background: "#fee2e2", borderRadius: 8, color: "#991b1b" }}>
        ⚠️ Erro: {error}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
        Nenhuma foto adicionada ainda a este ensaio.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "1rem",
      }}
    >
      {photos.map((photo) => (
        <div
          key={photo.id}
          style={{
            position: "relative",
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            aspectRatio: "1",
            background: "#f9fafb",
          }}
        >
          <img
            src={photo.signedUrl}
            alt={`Foto ${photo.sortOrder + 1}`}
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
                parent.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #9ca3af; font-size: 12px;">Imagem não disponível</div>`;
              }
            }}
          />
        </div>
      ))}
    </div>
  );
}

