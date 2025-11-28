"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CurrencyDisplay from "@/app/components/CurrencyDisplay";
import RichTextField from "@/components/rich-text/RichTextField";

interface ProdutoPhoto {
  id: string;
  storageKey: string;
  sortOrder: number;
}

interface Produto {
  id: string;
  slug: string;
  nome: string;
  shortDescription: string | null;
  fullDescription: string | null;
  precoEuro: number | null;
  categoria: string | null;
  isActive: boolean;
  coverImageKey: string | null;
  photos: ProdutoPhoto[];
}

interface ProdutoFormClientProps {
  produto?: Produto;
}

export default function ProdutoFormClient({ produto }: ProdutoFormClientProps) {
  const router = useRouter();
  const isEditing = !!produto;

  const [nome, setNome] = useState(produto?.nome || "");
  const [slug, setSlug] = useState(produto?.slug || "");
  const [shortDescription, setShortDescription] = useState(produto?.shortDescription || "");
  const [fullDescription, setFullDescription] = useState(produto?.fullDescription || "");
  const [precoEuro, setPrecoEuro] = useState(produto?.precoEuro?.toString() || "");
  const [categoria, setCategoria] = useState(produto?.categoria || "");
  const [isActive, setIsActive] = useState(produto?.isActive ?? true);
  const [coverImageKey, setCoverImageKey] = useState(produto?.coverImageKey || "");
  
  const [photos, setPhotos] = useState<Array<{ id: string; storageKey: string; url?: string }>>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Carregar fotos existentes
  useEffect(() => {
    if (produto?.photos && produto.photos.length > 0) {
      const loadPhotos = async () => {
        const photoPromises = produto.photos.map(async (photo) => {
          try {
            const res = await fetch(`/api/produtos/${produto.id}/photos/${photo.id}`, {
              credentials: "include",
            });
            if (res.ok) {
              const data = await res.json();
              return { id: photo.id, storageKey: photo.storageKey, url: data.signedUrl };
            }
          } catch (err) {
            console.error("Erro ao carregar foto:", err);
          }
          return { id: photo.id, storageKey: photo.storageKey };
        });
        const loadedPhotos = await Promise.all(photoPromises);
        setPhotos(loadedPhotos.filter((p) => p));
      };
      loadPhotos();
    }
  }, [produto]);

  // Gerar slug automaticamente a partir do nome
  useEffect(() => {
    if (!isEditing && nome) {
      const generatedSlug = nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generatedSlug);
    }
  }, [nome, isEditing]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "cover");
      formData.append("produtoId", produto?.id || "temp");

      const res = await fetch("/api/ensaios/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao fazer upload da capa");
      }

      const data = await res.json();
      setCoverImageKey(data.key);
    } catch (err: any) {
      setError(err.message || "Erro ao fazer upload da capa");
    } finally {
      setUploadingCover(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limitar a 3 fotos no total
    const totalPhotos = photos.length + newPhotos.length;
    if (totalPhotos + files.length > 3) {
      setError("Máximo de 3 fotos por produto. Remova algumas fotos antes de adicionar mais.");
      return;
    }

    setNewPhotos((prev) => [...prev, ...files.slice(0, 3 - totalPhotos)]);
  };

  const removePhoto = (index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = async (photoId: string) => {
    if (!produto) return;

    try {
      const res = await fetch(`/api/produtos/${produto.id}/photo/${photoId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Erro ao remover foto");
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err: any) {
      setError(err.message || "Erro ao remover foto");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Validar campos obrigatórios
      if (!nome.trim()) {
        throw new Error("Nome é obrigatório");
      }

      if (!slug.trim()) {
        throw new Error("Slug é obrigatório");
      }

      // Criar ou atualizar produto
      const produtoData = {
        nome: nome.trim(),
        slug: slug.trim(),
        shortDescription: shortDescription.trim() || null,
        fullDescription: fullDescription.trim() || null,
        precoEuro: precoEuro ? parseFloat(precoEuro) : null,
        categoria: categoria.trim() || null,
        isActive,
        coverImageKey: coverImageKey || null,
      };

      let produtoId: string;

      if (isEditing && produto) {
        // Atualizar produto existente
        const res = await fetch(`/api/produtos/${produto.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(produtoData),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erro ao atualizar produto");
        }

        produtoId = produto.id;
      } else {
        // Criar novo produto
        const res = await fetch("/api/produtos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(produtoData),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erro ao criar produto");
        }

        const data = await res.json();
        produtoId = data.produto.id;
      }

      // Upload de novas fotos
      if (newPhotos.length > 0) {
        setUploadingPhotos(true);
        try {
          for (const photo of newPhotos) {
            const formData = new FormData();
            formData.append("file", photo);
            formData.append("produtoId", produtoId);

            const res = await fetch("/api/produtos/upload-photo", {
              method: "POST",
              credentials: "include",
              body: formData,
            });

            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || "Erro ao fazer upload da foto");
            }
          }
        } finally {
          setUploadingPhotos(false);
        }
      }

      setSuccess(isEditing ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!");
      
      // Redirecionar após 1 segundo
      setTimeout(() => {
        router.push("/arquiteto/produtos");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar produto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Nome */}
      <div>
        <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: "0.5rem", color: "#111827" }}>
          Nome do Produto *
        </label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            fontSize: 14,
          }}
        />
      </div>

      {/* Slug */}
      <div>
        <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: "0.5rem", color: "#111827" }}>
          Slug (URL amigável) *
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          pattern="[a-z0-9-]+"
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            fontSize: 14,
            fontFamily: "monospace",
          }}
        />
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: "0.25rem" }}>
          Gerado automaticamente a partir do nome. Pode ser editado manualmente.
        </p>
      </div>

      {/* Descrição Curta */}
      <div>
        <RichTextField
          label="Descrição Curta"
          value={shortDescription}
          onChange={setShortDescription}
          placeholder="Resumo curto exibido nos cards da loja..."
        />
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: "0.25rem" }}>
          Resumo curto exibido nos cards da loja.
        </p>
      </div>

      {/* Descrição Completa */}
      <div>
        <RichTextField
          label="Descrição Completa"
          value={fullDescription}
          onChange={setFullDescription}
          placeholder="Descrição detalhada exibida na página do produto..."
        />
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: "0.25rem" }}>
          Descrição detalhada exibida na página do produto.
        </p>
      </div>

      {/* Preço e Categoria */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: "0.5rem", color: "#111827" }}>
            Preço (€) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={precoEuro}
            onChange={(e) => setPrecoEuro(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
            }}
          />
          {precoEuro && parseFloat(precoEuro) > 0 && (
            <div style={{ marginTop: "0.5rem", fontSize: 14 }}>
              <CurrencyDisplay valueEuro={parseFloat(precoEuro)} showBase={true} showNote={true} />
            </div>
          )}
        </div>

        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: "0.5rem", color: "#111827" }}>
            Categoria
          </label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            <option value="">Selecione...</option>
            <option value="Book">Book</option>
            <option value="Serviço">Serviço</option>
            <option value="Diária">Diária</option>
            <option value="Portfólio">Portfólio</option>
            <option value="Ensaio">Ensaio</option>
            <option value="Cortesia">Cortesia</option>
          </select>
        </div>
      </div>

      {/* Status Ativo */}
      <div>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            style={{ width: 18, height: 18, cursor: "pointer" }}
          />
          <span style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>
            Produto ativo (visível na loja)
          </span>
        </label>
      </div>

      {/* Upload Foto de Capa */}
      <div>
        <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: "0.5rem", color: "#111827" }}>
          Foto de Capa
        </label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/webp,image/png"
          onChange={handleCoverUpload}
          disabled={uploadingCover}
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            fontSize: 14,
          }}
        />
        {coverImageKey && (
          <div style={{ fontSize: 12, color: "#065f46", padding: "0.5rem", background: "#f0fdf4", borderRadius: 6, marginTop: "0.5rem" }}>
            ✓ Upload concluído: {coverImageKey}
          </div>
        )}
        {uploadingCover && (
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: "0.5rem" }}>Fazendo upload...</div>
        )}
      </div>

      {/* Upload Fotos de Visualização (máximo 3) */}
      <div>
        <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: "0.5rem", color: "#111827" }}>
          Fotos de Visualização (máximo 3) {photos.length + newPhotos.length > 0 && `(${photos.length + newPhotos.length}/3)`}
        </label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/webp,image/png"
          multiple
          onChange={handlePhotoUpload}
          disabled={uploadingPhotos || photos.length + newPhotos.length >= 3}
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            fontSize: 14,
          }}
        />
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: "0.25rem" }}>
          Até 3 fotos para visualização do produto. Máximo 3 MB por foto.
        </p>

        {/* Preview das fotos existentes */}
        {photos.length > 0 && (
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
            {photos.map((photo) => (
              <div
                key={photo.id}
                style={{
                  position: "relative",
                  width: "150px",
                  height: "150px",
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid #e5e7eb",
                }}
              >
                {photo.url ? (
                  <img
                    src={photo.url}
                    alt="Foto do produto"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
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
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    cursor: "pointer",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Preview das novas fotos */}
        {newPhotos.length > 0 && (
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
            {newPhotos.map((photo, index) => (
              <div
                key={index}
                style={{
                  position: "relative",
                  width: "150px",
                  height: "150px",
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid #e5e7eb",
                }}
              >
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Nova foto ${index + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  style={{
                    position: "absolute",
                    top: "0.5rem",
                    right: "0.5rem",
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    cursor: "pointer",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mensagens de erro/sucesso */}
      {error && (
        <div
          style={{
            padding: "1rem",
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            color: "#991b1b",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "1rem",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 8,
            color: "#065f46",
            fontSize: 14,
          }}
        >
          {success}
        </div>
      )}

      {/* Botões */}
      <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
        <Link
          href="/arquiteto/produtos"
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#fff",
            color: "#111827",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isSubmitting || uploadingCover || uploadingPhotos}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: 8,
            background: isSubmitting || uploadingCover || uploadingPhotos ? "#6b7280" : "#111827",
            color: "#fff",
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            cursor: isSubmitting || uploadingCover || uploadingPhotos ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? "Salvando..." : uploadingCover ? "Upload capa..." : uploadingPhotos ? "Upload fotos..." : isEditing ? "Salvar Alterações" : "Criar Produto"}
        </button>
      </div>
    </form>
  );
}

