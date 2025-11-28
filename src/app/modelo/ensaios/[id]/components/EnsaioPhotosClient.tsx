/**
 * Componente client-side para exibir fotos do ensaio (MODELO) com URLs assinadas efêmeras.
 * 
 * IMPORTANTE: MODELO só vê seus próprios ensaios PUBLICADOS via API protegida.
 */

"use client";

import { useEffect, useState } from "react";
import MasonryGrid from "@/components/galleries/MasonryGrid";

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
    fetch(`/api/ensaios/${ensaioId}/photos`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error("Acesso negado. Você só pode ver seus próprios ensaios publicados.");
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
        Ainda não há fotos disponíveis neste ensaio.
      </div>
    );
  }

  // Converter fotos para formato do MasonryGrid
  const photosForMasonry = photos.map((photo) => ({
    id: photo.id,
    url: photo.signedUrl,
    alt: `Foto ${photo.sortOrder + 1}`,
  }));

  return <MasonryGrid photos={photosForMasonry} columns={3} gap="1rem" />;
}

