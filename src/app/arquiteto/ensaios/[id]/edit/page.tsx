"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Ensaio {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  shootDate: string | null;
  status: "DRAFT" | "PUBLISHED";
  subjectCpf: string;
  coverImageKey: string | null;
  termPdfKey: string | null;
  syncFolderUrl: string | null;
  subject: {
    id: string;
    name: string | null;
    email: string;
    cpf: string | null;
    role: string;
  };
  photos: Array<{
    id: string;
    imageUrl: string;
    sortOrder: number;
  }>;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  cpf: string | null;
  role: string;
}

export default function EditEnsaioPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dados do ensaio
  const [ensaio, setEnsaio] = useState<Ensaio | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shootDate, setShootDate] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [coverImageKey, setCoverImageKey] = useState("");
  const [termPdfKey, setTermPdfKey] = useState("");
  const [syncFolderUrl, setSyncFolderUrl] = useState("");

  // Gerenciamento de fotos
  const [photos, setPhotos] = useState<Array<{ id: string; imageUrl: string; sortOrder: number }>>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState<string | null>(null);

  // Carregar ensaio
  useEffect(() => {
    async function loadEnsaio() {
      try {
        const res = await fetch(`/api/arquiteto/ensaios/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            router.push("/arquiteto/ensaios");
            return;
          }
          throw new Error("Erro ao carregar ensaio");
        }
        const data: Ensaio = await res.json();
        setEnsaio(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setShootDate(data.shootDate ? data.shootDate.split("T")[0] : "");
        setStatus(data.status);
        setCoverImageKey(data.coverImageKey || "");
        setTermPdfKey(data.termPdfKey || "");
        setSyncFolderUrl(data.syncFolderUrl || "");
        setPhotos(data.photos || []);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar ensaio");
      } finally {
        setLoading(false);
      }
    }
    loadEnsaio();
  }, [id, router]);

  // Salvar alterações
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/arquiteto/ensaios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          shootDate: shootDate || null,
          status,
          coverImageKey: coverImageKey.trim() || null,
          termPdfKey: termPdfKey.trim() || null,
          syncFolderUrl: syncFolderUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao atualizar ensaio");
      }

      setSuccess("Ensaio atualizado com sucesso!");
      setTimeout(() => {
        router.push(`/arquiteto/ensaios/${id}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar ensaio");
    } finally {
      setSaving(false);
    }
  }

  // Adicionar foto
  async function handleAddPhoto(e: React.FormEvent) {
    e.preventDefault();
    if (!newPhotoUrl.trim()) {
      setError("URL da foto é obrigatória.");
      return;
    }

    setAddingPhoto(true);
    setError(null);

    try {
      const res = await fetch(`/api/arquiteto/ensaios/${id}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: newPhotoUrl.trim(),
          sortOrder: photos.length,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao adicionar foto");
      }

      const data = await res.json();
      setPhotos([...photos, data.photo]);
      setNewPhotoUrl("");
      setSuccess("Foto adicionada com sucesso!");
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar foto");
    } finally {
      setAddingPhoto(false);
    }
  }

  // Remover foto
  async function handleRemovePhoto(photoId: string) {
    if (!confirm("Tem certeza que deseja remover esta foto?")) {
      return;
    }

    setRemovingPhoto(photoId);
    setError(null);

    try {
      const res = await fetch(`/api/arquiteto/ensaios/${id}/photos/${photoId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao remover foto");
      }

      setPhotos(photos.filter((p) => p.id !== photoId));
      setSuccess("Foto removida com sucesso!");
    } catch (err: any) {
      setError(err.message || "Erro ao remover foto");
    } finally {
      setRemovingPhoto(null);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!ensaio) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Ensaio não encontrado.</p>
        <Link href="/arquiteto/ensaios">Voltar para Ensaios</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "2rem",
        }}
      >
        <div>
          <Link
            href={`/arquiteto/ensaios/${id}`}
            style={{
              display: "inline-block",
              fontSize: 14,
              color: "#6b7280",
              textDecoration: "none",
              marginBottom: "0.5rem",
            }}
          >
            ← Voltar para Ensaio
          </Link>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: "0.5rem" }}>
            Editar Ensaio: {ensaio.title}
          </h1>
          <p style={{ color: "#6b7280", fontSize: 16 }}>
            Modelo/Cliente: {ensaio.subject?.name || ensaio.subject?.email || ensaio.subjectCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
          </p>
        </div>
      </header>

      <form onSubmit={handleSave} style={{ display: "grid", gap: "2rem" }}>
        {/* Campos básicos */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "1.5rem",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem" }}>
            Informações do Ensaio
          </h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                Nome do Ensaio *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                Descrição
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                  Data do Ensaio *
                </label>
                <input
                  type="date"
                  value={shootDate}
                  onChange={(e) => setShootDate(e.target.value)}
                  required
                  disabled={saving}
                  max={new Date().toISOString().split("T")[0]}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                  Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
                  required
                  disabled={saving}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  <option value="DRAFT">DRAFT (Rascunho)</option>
                  <option value="PUBLISHED">PUBLISHED (Publicado)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* URLs (Capa, Termo, Sync) */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "1.5rem",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem" }}>
            Links e Documentos
          </h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                Chave da Foto de Capa (R2) *
              </label>
              <input
                type="text"
                value={coverImageKey}
                onChange={(e) => setCoverImageKey(e.target.value)}
                required
                disabled={saving}
                placeholder="ensaio-123/cover.jpg"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
              <span style={{ fontSize: 12, color: "#6b7280", display: "block", marginTop: "0.25rem" }}>
                Chave do objeto no R2 (ex: ensaio-123/cover.jpg). Nunca use URLs públicas aqui.
              </span>
            </div>

            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                Chave do Termo PDF (R2) *
              </label>
              <input
                type="text"
                value={termPdfKey}
                onChange={(e) => setTermPdfKey(e.target.value)}
                required
                disabled={saving}
                placeholder="ensaio-123/term.pdf"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
              <span style={{ fontSize: 12, color: "#6b7280", display: "block", marginTop: "0.25rem" }}>
                Chave do objeto no R2 (ex: ensaio-123/term.pdf). Nunca use URLs públicas aqui.
              </span>
            </div>

            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                Sync Folder URL *
              </label>
              <textarea
                value={syncFolderUrl}
                onChange={(e) => setSyncFolderUrl(e.target.value)}
                required
                disabled={saving}
                placeholder="https://sync.com/folder/..."
                rows={2}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: "monospace",
                  resize: "vertical",
                }}
              />
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.75rem",
                  background: "#fef3c7",
                  border: "1px solid #fbbf24",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "#92400e",
                }}
              >
                <strong>⚠️ Segurança:</strong> Este link é sensível e protegido. MODELO/CLIENTE acessam via página interna protegida, não recebem o link diretamente.
              </div>
            </div>
          </div>
        </div>

        {/* Galeria de Fotos */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "1.5rem",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem" }}>
            Melhores Fotos ({photos.length}/30)
          </h2>
          
          {/* Adicionar foto */}
          <form onSubmit={handleAddPhoto} style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="url"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="https://exemplo.com/foto.jpg"
                disabled={addingPhoto || photos.length >= 30}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
              <button
                type="submit"
                disabled={addingPhoto || photos.length >= 30 || !newPhotoUrl.trim()}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: addingPhoto || photos.length >= 30 ? "#9ca3af" : "#111827",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: addingPhoto || photos.length >= 30 ? "not-allowed" : "pointer",
                }}
              >
                {addingPhoto ? "Adicionando..." : "Adicionar Foto"}
              </button>
            </div>
            {photos.length >= 30 && (
              <p style={{ fontSize: 12, color: "#dc2626", marginTop: "0.5rem" }}>
                Limite de 30 fotos atingido. Remova uma foto antes de adicionar outra.
              </p>
            )}
          </form>

          {/* Lista de fotos */}
          {photos.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: 14 }}>
              Nenhuma foto adicionada ainda. Use o formulário acima para adicionar fotos.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: "1rem",
              }}
            >
              {photos.map((photo, index) => (
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
                    src={photo.imageUrl}
                    alt={`Foto ${index + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        parent.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #9ca3af; font-size: 12px;">Imagem não disponível</div>`;
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    disabled={removingPhoto === photo.id}
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
                      cursor: removingPhoto === photo.id ? "not-allowed" : "pointer",
                    }}
                  >
                    {removingPhoto === photo.id ? "..." : "✕"}
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
                    #{index + 1}
                  </div>
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

        {/* Botões de ação */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
          <Link
            href={`/arquiteto/ensaios/${id}`}
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              background: "transparent",
              color: "#111827",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "0.75rem 1.5rem",
              background: saving ? "#9ca3af" : "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}

