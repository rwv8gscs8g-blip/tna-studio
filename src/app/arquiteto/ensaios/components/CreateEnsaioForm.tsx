"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UserSearchField, { User } from "@/app/components/UserSearchField";

interface CreateEnsaioFormProps {
  userId: string;
}

interface Projeto {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

interface Produto {
  id: string;
  nome: string;
  preco: number;
  isTfp: boolean;
}

export default function CreateEnsaioForm({ userId }: CreateEnsaioFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shootDate, setShootDate] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [coverImageKey, setCoverImageKey] = useState("");
  const [termPdfKey, setTermPdfKey] = useState("");
  const [syncFolderUrl, setSyncFolderUrl] = useState("");
  const [selectedProjetos, setSelectedProjetos] = useState<string[]>([]);
  const [selectedProdutos, setSelectedProdutos] = useState<string[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [miniGalleryKeys, setMiniGalleryKeys] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Upload states
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingTerm, setUploadingTerm] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState<boolean[]>([]);
  
  // Usuário selecionado (MODELO ou CLIENTE)
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const router = useRouter();

  // Carregar projetos e produtos ativos
  useEffect(() => {
    async function loadData() {
      try {
        const [projetosRes, produtosRes] = await Promise.all([
          fetch("/api/projetos?active=true"),
          fetch("/api/produtos"),
        ]);
        
        if (projetosRes.ok) {
          const projetosData = await projetosRes.json();
          setProjetos(projetosData.projetos || []);
        }
        
        if (produtosRes.ok) {
          const produtosData = await produtosRes.json();
          setProdutos(produtosData.produtos || []);
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      }
    }
    loadData();
  }, []);

  // Gerar slug a partir do título
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^\w\s-]/g, "") // Remove caracteres especiais
      .replace(/\s+/g, "-") // Substitui espaços por hífen
      .replace(/-+/g, "-") // Remove hífens duplicados
      .trim();
  };

  const handleUserChange = (user: User | null) => {
    setSelectedUser(user);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "cover");

      const res = await fetch("/api/ensaios/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
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

  const handleTermUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tipo
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Apenas arquivos PDF são aceitos. Por favor, selecione um arquivo .pdf válido.");
      e.target.value = ""; // Limpa o input
      return;
    }

    // Validação de tamanho (3 MB)
    const MAX_PDF_SIZE = 3 * 1024 * 1024; // 3 MB
    if (file.size > MAX_PDF_SIZE) {
      setError(`Arquivo muito grande. Tamanho máximo: 3 MB. Tamanho atual: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      e.target.value = ""; // Limpa o input
      return;
    }

    setUploadingTerm(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "term");

      const res = await fetch("/api/ensaios/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao fazer upload do termo");
      }

      const data = await res.json();
      setTermPdfKey(data.key);
    } catch (err: any) {
      setError(err.message || "Erro ao fazer upload do termo");
    } finally {
      setUploadingTerm(false);
    }
  };

  const handleMiniGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Limitar a 5 fotos
    const filesToUpload = Array.from(files).slice(0, 5);
    if (filesToUpload.length + miniGalleryKeys.length > 5) {
      setError("Máximo de 5 fotos na mini-galeria.");
      return;
    }

    setUploadingPhotos(new Array(filesToUpload.length).fill(true));
    const newKeys: string[] = [];

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "photo");

        const res = await fetch("/api/ensaios/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Erro ao fazer upload da foto ${i + 1}`);
        }

        const data = await res.json();
        newKeys.push(data.key);
      }

      setMiniGalleryKeys([...miniGalleryKeys, ...newKeys]);
    } catch (err: any) {
      setError(err.message || "Erro ao fazer upload das fotos");
    } finally {
      setUploadingPhotos([]);
    }
  };

  const removeMiniGalleryPhoto = (index: number) => {
    setMiniGalleryKeys(miniGalleryKeys.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!title.trim()) {
      setError("O título é obrigatório.");
      setIsSubmitting(false);
      return;
    }

    if (!selectedUser || !selectedUser.cpf) {
      setError("É necessário selecionar um Modelo ou Cliente.");
      setIsSubmitting(false);
      return;
    }

    if (!shootDate) {
      setError("A data do ensaio é obrigatória.");
      return;
    }

    // Impede submit duplo
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const slug = generateSlug(title);
      const normalizedCpf = selectedUser.cpf.replace(/\D/g, "");
      
      const response = await fetch("/api/arquiteto/ensaios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          slug,
          description: description.trim() || null,
          shootDate: shootDate,
          status,
          subjectCpf: normalizedCpf,
          coverImageKey: coverImageKey.trim() || null,
          termPdfKey: termPdfKey.trim() || null,
          syncFolderUrl: syncFolderUrl.trim() || null,
          projetoIds: selectedProjetos, // IDs dos projetos selecionados
          produtoIds: selectedProdutos, // IDs dos produtos selecionados
          miniGalleryKeys: miniGalleryKeys, // Chaves das 5 fotos da mini-galeria
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao criar ensaio.");
      }

      // Buscar ID do ensaio criado para redirecionar
      const data = await response.json();
      setSuccess("Ensaio criado com sucesso!");
      
      // Redireciona para o detalhe do ensaio criado após 1 segundo
      setTimeout(() => {
        if (data.ensaio?.id) {
          router.push(`/arquiteto/ensaios/${data.ensaio.id}`);
        } else {
          router.push("/arquiteto/ensaios");
        }
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Erro ao criar ensaio. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "1.25rem",
        backgroundColor: "#ffffff",
        marginBottom: "2rem",
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: "1rem" }}>
        Criar Novo Ensaio
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
        {/* Busca de Modelo ou Cliente */}
        <UserSearchField
          value={selectedUser}
          onChange={handleUserChange}
          label="Modelo ou Cliente"
          placeholder="Buscar por nome, email ou CPF..."
          required
          disabled={isSubmitting}
        />

        {/* Data do Ensaio */}
        <div>
          <label style={{ display: "grid", gap: "0.5rem" }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Data do Ensaio *</span>
            <input
              type="date"
              value={shootDate}
              onChange={(e) => setShootDate(e.target.value)}
              required
              disabled={isSubmitting}
              max={new Date().toISOString().split("T")[0]}
              style={{
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
            <span style={{ fontSize: 12, color: "#6b7280" }}>Formato: AAAA-MM-DD</span>
          </label>
        </div>

        {/* Título */}
        <div>
          <label style={{ display: "grid", gap: "0.5rem" }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Título do Ensaio *</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Ensaio de Verão 2025"
              required
              disabled={isSubmitting}
              style={{
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </label>
        </div>

        {/* Descrição */}
        <div>
          <label style={{ display: "grid", gap: "0.5rem" }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Descrição</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do ensaio (opcional)"
              disabled={isSubmitting}
              rows={3}
              style={{
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </label>
        </div>

        {/* Status */}
        <div>
          <label style={{ display: "grid", gap: "0.5rem" }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Status *</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
              required
              disabled={isSubmitting}
              style={{
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
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              DRAFT: apenas você vê. PUBLISHED: a modelo/cliente vê na lista de ensaios.
            </span>
          </label>
        </div>

        {/* Projetos (multi-select) */}
        <div>
          <label style={{ display: "grid", gap: "0.5rem" }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Projetos deste Ensaio</span>
            <select
              multiple
              value={selectedProjetos}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedProjetos(values);
              }}
              disabled={isSubmitting}
              style={{
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
                minHeight: "100px",
                background: "white",
              }}
            >
              {projetos.filter(p => p.active).map((projeto) => (
                <option key={projeto.id} value={projeto.id}>
                  {projeto.name}
                </option>
              ))}
            </select>
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Selecione um ou mais projetos (segure Ctrl/Cmd para múltipla seleção). Opcional.
            </span>
          </label>
        </div>

        {/* Produtos (multi-select) */}
        <div>
          <label style={{ display: "grid", gap: "0.5rem" }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Produtos deste Ensaio</span>
            <select
              multiple
              value={selectedProdutos}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedProdutos(values);
              }}
              disabled={isSubmitting}
              style={{
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
                minHeight: "150px",
                background: "white",
              }}
            >
              {produtos
                .sort((a, b) => {
                  // Ordenar: TFP primeiro, depois por nome
                  if (a.isTfp && !b.isTfp) return -1;
                  if (!a.isTfp && b.isTfp) return 1;
                  return a.nome.localeCompare(b.nome);
                })
                .map((produto) => {
                  const priceLabel = produto.isTfp 
                    ? "TFP / Permuta" 
                    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(produto.preco);
                  return (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome} – {priceLabel}
                    </option>
                  );
                })}
            </select>
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Selecione um ou mais produtos (segure Ctrl/Cmd para múltipla seleção). Opcional.
            </span>
          </label>
        </div>

        {/* Upload Foto de Capa */}
        <div>
          <label style={{ display: "grid", gap: "0.5rem" }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Foto de Capa *</span>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/webp,image/png"
              onChange={handleCoverUpload}
              disabled={isSubmitting || uploadingCover}
              style={{
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
            {coverImageKey && (
              <div style={{ fontSize: 12, color: "#065f46", padding: "0.5rem", background: "#f0fdf4", borderRadius: 6 }}>
                ✓ Upload concluído: {coverImageKey}
              </div>
            )}
            {uploadingCover && (
              <div style={{ fontSize: 12, color: "#6b7280" }}>Fazendo upload...</div>
            )}
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Recomendado: WebP, resolução 2048px lado maior, qualidade 80. Máximo 3 MB.
            </span>
            {/* Campo oculto para manter a key */}
            <input type="hidden" value={coverImageKey} required />
          </label>
        </div>

        {/* Upload Termo PDF */}
        <div>
          <label style={{ display: "grid", gap: "0.5rem" }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Termo PDF *</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleTermUpload}
              disabled={isSubmitting || uploadingTerm}
              style={{
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
            {termPdfKey && (
              <div style={{ fontSize: 12, color: "#065f46", padding: "0.5rem", background: "#f0fdf4", borderRadius: 6 }}>
                ✓ Upload concluído: {termPdfKey}
              </div>
            )}
            {uploadingTerm && (
              <div style={{ fontSize: 12, color: "#6b7280" }}>Fazendo upload...</div>
            )}
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              PDF do termo de autorização. Máximo 3 MB. Apenas arquivos .pdf são aceitos.
            </span>
            {/* Campo oculto para manter a key */}
            <input type="hidden" value={termPdfKey} required />
          </label>
        </div>

        {/* Mini-galeria (5 fotos) */}
        <div>
          <label style={{ display: "grid", gap: "0.5rem" }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              Mini-galeria (até 5 fotos) {miniGalleryKeys.length > 0 && `(${miniGalleryKeys.length}/5)`}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/webp,image/png"
              multiple
              onChange={handleMiniGalleryUpload}
              disabled={isSubmitting || miniGalleryKeys.length >= 5 || uploadingPhotos.some((u) => u)}
              style={{
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
            {miniGalleryKeys.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                {miniGalleryKeys.map((key, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "0.5rem",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 6,
                      fontSize: 12,
                      color: "#065f46",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span>✓ {key.split("/").pop()}</span>
                    <button
                      type="button"
                      onClick={() => removeMiniGalleryPhoto(index)}
                      disabled={isSubmitting}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#dc2626",
                        cursor: "pointer",
                        fontSize: 14,
                        padding: "0.25rem",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {uploadingPhotos.some((u) => u) && (
              <div style={{ fontSize: 12, color: "#6b7280" }}>Fazendo upload das fotos...</div>
            )}
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Selecione até 5 fotos para a mini-galeria do ensaio. Recomendado: WebP, 2048px lado maior, qualidade 80. Máximo 3 MB por foto.
            </span>
          </label>
        </div>

        {/* Sync Folder URL */}
        <div>
          <label style={{ display: "grid", gap: "0.5rem" }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Sync Folder URL *</span>
            <textarea
              value={syncFolderUrl}
              onChange={(e) => setSyncFolderUrl(e.target.value)}
              placeholder="https://sync.com/folder/..."
              required
              disabled={isSubmitting}
              rows={2}
              style={{
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
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              URL da pasta completa do ensaio no Sync.com (apenas para ARQUITETO/ADMIN).
            </span>
          </label>
        </div>

        {error && (
          <div
            style={{
              color: "#b91c1c",
              fontSize: 14,
              padding: "0.75rem",
              backgroundColor: "#fee2e2",
              borderRadius: 6,
              border: "1px solid #fecaca",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              color: "#065f46",
              fontSize: 14,
              padding: "0.75rem",
              backgroundColor: "#f0fdf4",
              borderRadius: 6,
              border: "1px solid #bbf7d0",
            }}
          >
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: "0.75rem 1.25rem",
            borderRadius: 6,
            background: isSubmitting ? "#6b7280" : "#111827",
            color: "white",
            fontWeight: 600,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
          }}
        >
          {isSubmitting ? "Criando..." : "Criar Ensaio"}
        </button>
      </form>
    </div>
  );
}

