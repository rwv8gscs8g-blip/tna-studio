"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";

interface ProductDetailClientProps {
  produto: {
    id: string;
    nome: string;
    descricao?: string | null;
    preco: number;
    categoria?: string | null;
    isPromocao: boolean;
    isTfp: boolean;
    coverImageKey?: string | null;
    photos: Array<{
      id: string;
      storageKey: string;
      sortOrder: number;
    }>;
    _count: {
      ensaios: number;
      intencoes: number;
    };
  };
  userRole: Role;
  intencaoExistente: {
    id: string;
    status: string;
  } | null;
}

export default function ProductDetailClient({
  produto,
  userRole,
  intencaoExistente,
}: ProductDetailClientProps) {
  const router = useRouter();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadImages() {
      try {
        // Carregar capa
        if (produto.coverImageKey) {
          const coverRes = await fetch(`/api/produtos/${produto.id}/cover`);
          if (coverRes.ok) {
            const coverData = await coverRes.json();
            setCoverUrl(coverData.signedUrl);
          }
        }

        // Carregar fotos da mini-galeria
        const photoPromises = produto.photos.map(async (photo) => {
          const res = await fetch(`/api/produtos/${produto.id}/photos/${photo.id}`);
          if (res.ok) {
            const data = await res.json();
            return { id: photo.id, url: data.signedUrl };
          }
          return null;
        });

        const photos = await Promise.all(photoPromises);
        const urls: Record<string, string> = {};
        photos.forEach((p) => {
          if (p) urls[p.id] = p.url;
        });
        setPhotoUrls(urls);
      } catch (err) {
        console.error("Erro ao carregar imagens:", err);
      } finally {
        setLoading(false);
      }
    }

    loadImages();
  }, [produto.id, produto.coverImageKey, produto.photos]);

  const handleQueroEsteProduto = async () => {
    if (userRole !== Role.MODELO) {
      setMessage({ type: "error", text: "Apenas modelos podem criar intenções de compra." });
      return;
    }

    if (intencaoExistente) {
      setMessage({ type: "error", text: "Você já tem uma intenção de compra pendente para este produto." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/intencoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produtoId: produto.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao criar intenção de compra");
      }

      setMessage({ type: "success", text: "Intenção de compra criada com sucesso! O Arquiteto será notificado." });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Erro ao criar intenção de compra" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "TFP / Permuta";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <Link
        href="/loja"
        style={{
          display: "inline-block",
          fontSize: 14,
          color: "#6b7280",
          textDecoration: "none",
          marginBottom: "1rem",
        }}
      >
        ← Voltar para Loja
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
        {/* Imagens */}
        <div>
          {loading ? (
            <div
              style={{
                width: "100%",
                height: "400px",
                backgroundColor: "#f3f4f6",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6b7280",
              }}
            >
              Carregando...
            </div>
          ) : coverUrl ? (
            <img
              src={coverUrl}
              alt={produto.nome}
              style={{
                width: "100%",
                height: "400px",
                objectFit: "cover",
                borderRadius: 12,
                marginBottom: "1rem",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "400px",
                backgroundColor: "#f3f4f6",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3af",
              }}
            >
              Sem imagem
            </div>
          )}

          {/* Mini-galeria (5 fotos) */}
          {produto.photos.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "0.5rem",
              }}
            >
              {produto.photos.slice(0, 5).map((photo) => (
                <div
                  key={photo.id}
                  style={{
                    width: "100%",
                    height: "80px",
                    borderRadius: 8,
                    overflow: "hidden",
                    backgroundColor: "#f3f4f6",
                  }}
                >
                  {photoUrls[photo.id] ? (
                    <img
                      src={photoUrls[photo.id]}
                      alt={`Foto ${photo.sortOrder + 1}`}
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
                        fontSize: 10,
                        color: "#9ca3af",
                      }}
                    >
                      ...
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informações */}
        <div>
          <div style={{ marginBottom: "1rem" }}>
            {(produto.isPromocao || produto.isTfp) && (
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                {produto.isTfp && (
                  <span
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      backgroundColor: "#fef3c7",
                      color: "#92400e",
                      textTransform: "uppercase",
                    }}
                  >
                    🔥 TFP / Permuta
                  </span>
                )}
                {produto.isPromocao && !produto.isTfp && (
                  <span
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      backgroundColor: "#dcfce7",
                      color: "#166534",
                      textTransform: "uppercase",
                    }}
                  >
                    Promoção
                  </span>
                )}
              </div>
            )}
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: "0.5rem", color: "#111827" }}>
              {produto.nome}
            </h1>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: produto.isTfp ? "#92400e" : "#111827",
                marginBottom: "1rem",
              }}
            >
              {formatPrice(produto.preco)}
            </div>
          </div>

          {produto.descricao && (
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: "0.75rem" }}>Descrição</h2>
              <p style={{ color: "#6b7280", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {produto.descricao}
              </p>
            </div>
          )}

          {/* Contrapartidas */}
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: "0.75rem" }}>Contrapartidas</h2>
            <div
              style={{
                padding: "1rem",
                background: "#f9fafb",
                borderRadius: 8,
                fontSize: 14,
                color: "#6b7280",
              }}
            >
              {produto.isTfp ? (
                <p>
                  Este é um ensaio TFP (Time For Print) / Permuta. Você receberá as fotos editadas em troca da
                  autorização de uso de imagem para fins comerciais e artísticos.
                </p>
              ) : (
                <p>
                  Ao adquirir este produto, você receberá todas as fotos editadas do ensaio em alta resolução,
                  além de autorização para uso pessoal e profissional das imagens.
                </p>
              )}
            </div>
          </div>

          {/* Estatísticas */}
          <div
            style={{
              display: "flex",
              gap: "2rem",
              marginBottom: "2rem",
              padding: "1rem",
              background: "#f9fafb",
              borderRadius: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Ensaios realizados</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
                {produto._count.ensaios}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Intenções de compra</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
                {produto._count.intencoes}
              </div>
            </div>
          </div>

          {/* Botão de ação */}
          {userRole === Role.MODELO && (
            <div>
              {intencaoExistente ? (
                <div
                  style={{
                    padding: "1rem",
                    background: "#fef3c7",
                    border: "1px solid #fbbf24",
                    borderRadius: 8,
                    color: "#92400e",
                    fontSize: 14,
                    textAlign: "center",
                  }}
                >
                  Você já tem uma intenção de compra pendente para este produto.
                </div>
              ) : (
                <button
                  onClick={handleQueroEsteProduto}
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    padding: "1rem 2rem",
                    borderRadius: 8,
                    background: isSubmitting ? "#6b7280" : "#111827",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    border: "none",
                  }}
                >
                  {isSubmitting ? "Processando..." : "Quero este produto / Selecionar para ensaio"}
                </button>
              )}
            </div>
          )}

          {userRole === Role.ARQUITETO && (
            <div
              style={{
                padding: "1rem",
                background: "#e0f2fe",
                border: "1px solid #7dd3fc",
                borderRadius: 8,
                color: "#0c4a6e",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              Como Arquiteto, você pode selecionar este produto ao criar um ensaio.
            </div>
          )}

          {message && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                borderRadius: 8,
                background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                color: message.type === "success" ? "#065f46" : "#991b1b",
                fontSize: 14,
              }}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

