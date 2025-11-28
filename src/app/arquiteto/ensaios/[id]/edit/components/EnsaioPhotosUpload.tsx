"use client";

import { useState } from "react";

interface Photo {
  id: string;
  storageKey: string;
  sortOrder: number;
  url?: string;
}

interface EnsaioPhotosUploadProps {
  ensaioId: string;
  existingPhotos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
}

const MAX_PHOTOS = 30;
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/webp", "image/png"];

export default function EnsaioPhotosUpload({
  ensaioId,
  existingPhotos,
  onPhotosChange,
}: EnsaioPhotosUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validar quantidade total
    const totalPhotos = existingPhotos.length + newPhotos.length;
    if (totalPhotos + files.length > MAX_PHOTOS) {
      setError(`Máximo de ${MAX_PHOTOS} fotos por ensaio. Remova algumas fotos antes de adicionar mais.`);
      return;
    }

    // Validar cada arquivo
    const validFiles: File[] = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`Arquivo "${file.name}" excede 3 MB. Máximo permitido: 3 MB por foto.`);
        continue;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`Arquivo "${file.name}" não é uma imagem válida. Use JPG, PNG ou WebP.`);
        continue;
      }
      validFiles.push(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({
          ...prev,
          [file.name]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }

    setNewPhotos((prev) => [...prev, ...validFiles.slice(0, MAX_PHOTOS - totalPhotos)]);
    setError(null);
  };

  const removeNewPhoto = (index: number) => {
    const file = newPhotos[index];
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const updated = { ...prev };
      delete updated[file.name];
      return updated;
    });
  };

  const removeExistingPhoto = async (photoId: string) => {
    if (!confirm("Tem certeza que deseja remover esta foto?")) return;

    try {
      const res = await fetch(`/api/arquiteto/ensaios/${ensaioId}/photos/${photoId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao remover foto");
      }

      onPhotosChange(existingPhotos.filter((p) => p.id !== photoId));
    } catch (err: any) {
      setError(err.message || "Erro ao remover foto");
    }
  };

  const handleUpload = async () => {
    if (newPhotos.length === 0) return;

    setUploading(true);
    setError(null);
    const uploadedPhotos: Photo[] = [];

    try {
      for (let i = 0; i < newPhotos.length; i++) {
        const file = newPhotos[i];
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        // Upload do arquivo
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "photo");
        formData.append("ensaioId", ensaioId);

        const uploadRes = await fetch("/api/ensaios/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error || `Erro ao fazer upload de "${file.name}"`);
        }

        const uploadData = await uploadRes.json();

        // Adicionar foto ao ensaio
        const addRes = await fetch(`/api/arquiteto/ensaios/${ensaioId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            imageUrl: uploadData.key, // storageKey (a API espera imageUrl mas usa como storageKey)
            sortOrder: existingPhotos.length + uploadedPhotos.length,
          }),
        });

        if (!addRes.ok) {
          const data = await addRes.json();
          throw new Error(data.error || `Erro ao adicionar foto "${file.name}"`);
        }

        const photoData = await addRes.json();
        
        // Buscar URL assinada da foto recém-criada
        let photoUrl: string | undefined;
        try {
          const urlRes = await fetch(`/api/ensaios/${ensaioId}/photos/${photoData.photo.id}/url`, {
            credentials: "include",
          });
          if (urlRes.ok) {
            const urlData = await urlRes.json();
            photoUrl = urlData.url;
          }
        } catch (err) {
          console.error("Erro ao buscar URL da foto:", err);
        }
        
        uploadedPhotos.push({ ...photoData.photo, url: photoUrl });
        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
      }

      // Atualizar lista de fotos
      onPhotosChange([...existingPhotos, ...uploadedPhotos]);
      setNewPhotos([]);
      setPreviews({});
      setUploadProgress({});
    } catch (err: any) {
      setError(err.message || "Erro ao fazer upload das fotos");
    } finally {
      setUploading(false);
    }
  };

  const setCoverPhoto = async (photoId: string) => {
    try {
      const photo = existingPhotos.find((p) => p.id === photoId);
      if (!photo) return;

      const res = await fetch(`/api/arquiteto/ensaios/${ensaioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          coverImageKey: photo.storageKey,
        }),
      });

      if (!res.ok) {
        throw new Error("Erro ao definir foto de capa");
      }

      // Recarregar página para atualizar
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Erro ao definir foto de capa");
    }
  };

  const totalPhotos = existingPhotos.length + newPhotos.length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: 18, fontWeight: 600 }}>
          Álbum de Fotos ({totalPhotos}/{MAX_PHOTOS})
        </h3>
        {newPhotos.length > 0 && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            style={{
              padding: "0.5rem 1rem",
              background: uploading ? "#9ca3af" : "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? "Enviando..." : `Enviar ${newPhotos.length} foto(s)`}
          </button>
        )}
      </div>

      {/* Input de upload */}
      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/webp,image/png"
          multiple
          onChange={handleFileSelect}
          disabled={uploading || totalPhotos >= MAX_PHOTOS}
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 14,
            cursor: uploading || totalPhotos >= MAX_PHOTOS ? "not-allowed" : "pointer",
          }}
        />
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: "0.5rem" }}>
          Selecione até {MAX_PHOTOS - totalPhotos} foto(s). Máximo 3 MB por foto. Formatos: JPG, PNG, WebP.
        </p>
        {totalPhotos >= MAX_PHOTOS && (
          <p style={{ fontSize: 12, color: "#dc2626", marginTop: "0.5rem" }}>
            Limite de {MAX_PHOTOS} fotos atingido. Remova algumas fotos antes de adicionar mais.
          </p>
        )}
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div
          style={{
            padding: "0.75rem",
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: 6,
            color: "#991b1b",
            fontSize: 14,
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Grid de fotos */}
      {totalPhotos === 0 ? (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            background: "#f9fafb",
            borderRadius: 8,
            color: "#6b7280",
            fontSize: 14,
          }}
        >
          <p style={{ marginBottom: "0.5rem", fontWeight: 500 }}>Sem fotos na galeria</p>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>
            Use o campo acima para fazer upload de fotos (até 30 por ensaio).
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "1rem",
          }}
        >
          {/* Fotos existentes */}
          {existingPhotos.map((photo, index) => (
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
              {photo.url ? (
                <img
                  src={photo.url}
                  alt={`Foto ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9ca3af",
                    fontSize: 12,
                  }}
                >
                  Carregando...
                </div>
              )}
              <button
                type="button"
                onClick={() => removeExistingPhoto(photo.id)}
                style={{
                  position: "absolute",
                  top: "0.5rem",
                  right: "0.5rem",
                  padding: "0.5rem",
                  background: "rgba(220, 38, 38, 0.9)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
              <button
                type="button"
                onClick={() => setCoverPhoto(photo.id)}
                style={{
                  position: "absolute",
                  bottom: "0.5rem",
                  left: "0.5rem",
                  padding: "0.25rem 0.5rem",
                  background: "rgba(0,0,0,0.7)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Capa
              </button>
              <div
                style={{
                  position: "absolute",
                  bottom: "0.5rem",
                  right: "0.5rem",
                  padding: "0.25rem 0.5rem",
                  background: "rgba(0,0,0,0.7)",
                  color: "#fff",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                #{index + 1}
              </div>
            </div>
          ))}

          {/* Novas fotos (preview) */}
          {newPhotos.map((file, index) => (
            <div
              key={file.name}
              style={{
                position: "relative",
                borderRadius: 8,
                overflow: "hidden",
                border: "2px dashed #d1d5db",
                aspectRatio: "1",
                background: "#f9fafb",
              }}
            >
              {previews[file.name] ? (
                <img
                  src={previews[file.name]}
                  alt={`Nova foto ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9ca3af",
                    fontSize: 12,
                  }}
                >
                  Carregando preview...
                </div>
              )}
              {uploadProgress[file.name] !== undefined && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "4px",
                    background: "#e5e7eb",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${uploadProgress[file.name]}%`,
                      background: "#111827",
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeNewPhoto(index)}
                style={{
                  position: "absolute",
                  top: "0.5rem",
                  right: "0.5rem",
                  padding: "0.5rem",
                  background: "rgba(220, 38, 38, 0.9)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
              <div
                style={{
                  position: "absolute",
                  bottom: "0.5rem",
                  left: "0.5rem",
                  padding: "0.25rem 0.5rem",
                  background: "rgba(0,0,0,0.7)",
                  color: "#fff",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                Novo
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

