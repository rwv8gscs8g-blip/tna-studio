/**
 * Página de detalhes da galeria com fotos
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Photo {
  id: string;
  key: string;
  title: string | null;
  mimeType: string;
  bytes: number;
  isSensitive: boolean;
  createdAt: string;
}

interface Gallery {
  id: string;
  title: string;
  description: string | null;
  isPrivate: boolean;
  photos: Photo[];
  user: { name: string | null; email: string };
}

export default function GalleryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const galleryId = params.id as string;

  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/galleries/${galleryId}`)
      .then((res) => {
        if (res.status === 401) {
          router.push("/signin");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        
        if (data.error) {
          console.error(data.error);
          if (data.error.includes("Não autenticado") || data.error.includes("Acesso negado")) {
            router.push("/signin");
          } else {
            router.push("/galleries");
          }
        } else {
          setGallery(data);
        }
      })
      .catch((err) => {
        console.error(err);
        router.push("/signin");
      })
      .finally(() => setLoading(false));
  }, [galleryId, router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("galleryId", galleryId);

    try {
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setUploadError(data.error || `Erro ${res.status}: ${res.statusText}`);
        return;
      }

      // Recarrega a galeria
      const galleryRes = await fetch(`/api/galleries/${galleryId}`);
      if (galleryRes.ok) {
        const galleryData = await galleryRes.json();
        setGallery(galleryData);
        e.target.value = ""; // Limpa o input
        setUploadError(null);
      } else {
        setUploadError("Upload concluído, mas erro ao recarregar a galeria");
      }
    } catch (error: any) {
      console.error("Erro no upload:", error);
      setUploadError(error.message || "Erro ao fazer upload. Verifique o console para mais detalhes.");
    } finally {
      setUploading(false);
    }
  };


  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!gallery) {
    return null;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "center" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              color: "#111827",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            ← Início
          </Link>
          <Link
            href="/galleries"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              color: "#111827",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            ← Galerias
          </Link>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
          {gallery.title}
        </h1>
        {gallery.description && (
          <p style={{ fontSize: 16, color: "#6b7280", marginBottom: 8 }}>
            {gallery.description}
          </p>
        )}
        <div style={{ fontSize: 14, color: "#6b7280" }}>
          {gallery.isPrivate && "🔒 "}
          {gallery.photos.length} foto{gallery.photos.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div style={{ marginBottom: "2rem", padding: "1rem", background: "#f9fafb", borderRadius: 8 }}>
        <label
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            background: uploading ? "#9ca3af" : "#111",
            color: "#fff",
            borderRadius: 8,
            cursor: uploading ? "not-allowed" : "pointer",
            fontSize: 16,
            fontWeight: 500,
          }}
        >
          {uploading ? "Enviando..." : "Fazer Upload"}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
        {uploadError && (
          <div style={{ marginTop: "0.5rem", color: "#b91c1c", fontSize: 14 }}>
            {uploadError}
          </div>
        )}
      </div>

      {gallery.photos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#6b7280" }}>
          <p>Nenhuma foto nesta galeria ainda.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          {gallery.photos.map((photo) => (
            <PhotoThumbnail key={photo.id} photo={photo} />
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoThumbnail({ photo }: { photo: Photo }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getPhotoUrl = async (photoId: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/media/sign?photoId=${photoId}&expiresIn=3600`);
      
      if (!res.ok) {
        const errorData = await res.json();
        const errorMsg = errorData.error || `Erro ${res.status}`;
        
        // Log no servidor via API
        try {
          await fetch("/api/log-error", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "photo_url_error",
              photoId,
              error: errorMsg,
              status: res.status,
            }),
          });
        } catch (logError) {
          // Ignora erro de log
        }
        
        // Fallback: sempre tenta usar rota direta se API falhar
        const baseUrl = window.location.origin;
        const fallbackUrl = `${baseUrl}/api/media/serve/${photoId}`;
        console.warn(`[PhotoThumbnail] API falhou, usando fallback para rota local: ${fallbackUrl}`);
        return fallbackUrl;
        
        throw new Error(errorMsg);
      }
      
      const data = await res.json();
      
      if (!data.url) {
        // Fallback: sempre tenta usar rota direta se URL não retornada
        const baseUrl = window.location.origin;
        const fallbackUrl = `${baseUrl}/api/media/serve/${photoId}`;
        console.warn(`[PhotoThumbnail] URL não retornada, usando fallback: ${fallbackUrl}`);
        return fallbackUrl;
      }
      
      return data.url;
    } catch (error: any) {
      // Log no servidor
      try {
        await fetch("/api/log-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "photo_url_fetch_error",
            photoId,
            error: error.message || "Erro desconhecido",
          }),
        });
      } catch (logError) {
        // Ignora erro de log
      }
      
      // Fallback final: sempre tenta rota local
      const baseUrl = window.location.origin;
      const fallbackUrl = `${baseUrl}/api/media/serve/${photoId}`;
      console.warn(`[PhotoThumbnail] Erro no fetch, usando fallback final: ${fallbackUrl}`);
      return fallbackUrl;
    }
  };

  useEffect(() => {
    getPhotoUrl(photo.id).then((url) => {
      setImageUrl(url);
      setLoading(false);
    });
  }, [photo.id]);

  if (loading) {
    return (
      <div
        style={{
          aspectRatio: "1",
          background: "#f3f4f6",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          color: "#6b7280",
        }}
      >
        Carregando...
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div
        style={{
          aspectRatio: "1",
          background: "#fee2e2",
          borderRadius: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          fontSize: 12,
          color: "#991b1b",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 4 }}>⚠️</div>
        <div>{error || "Erro ao carregar"}</div>
        <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>
          {photo.title || photo.key}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "1",
        borderRadius: 8,
        overflow: "hidden",
        background: "#f3f4f6",
      }}
    >
      <img
        src={imageUrl}
        alt={photo.title || "Foto"}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        onError={(e) => {
          console.error("Erro ao carregar imagem:", imageUrl);
          setError("Erro ao renderizar imagem");
          setImageUrl(null);
        }}
      />
      {photo.isSensitive && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            padding: "4px 8px",
            borderRadius: 4,
            fontSize: 12,
          }}
        >
          Sensível
        </div>
      )}
    </div>
  );
}

