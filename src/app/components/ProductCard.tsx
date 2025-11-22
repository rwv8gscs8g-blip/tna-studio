"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface ProductCardProps {
  produto: {
    id: string;
    nome: string;
    descricao?: string | null;
    preco: number;
    categoria?: string | null;
    isPromocao: boolean;
    isTfp: boolean;
    coverImageKey?: string | null;
  };
}

export default function ProductCard({ produto }: ProductCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (produto.coverImageKey) {
      // Buscar URL assinada via API
      fetch(`/api/produtos/${produto.id}/cover`)
        .then((res) => res.json())
        .then((data) => {
          if (data.signedUrl) {
            setImageUrl(data.signedUrl);
          }
        })
        .catch((err) => {
          console.error("Erro ao carregar imagem:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [produto.id, produto.coverImageKey]);

  const formatPrice = (price: number) => {
    if (price === 0) return "TFP / Permuta";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <Link
      href={`/loja/produto/${produto.id}`}
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "1rem",
          backgroundColor: "#ffffff",
          transition: "transform 0.2s, box-shadow 0.2s",
          cursor: "pointer",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Badges de Promoção/TFP */}
        {(produto.isPromocao || produto.isTfp) && (
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
            {produto.isTfp && (
              <span
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: 6,
                  fontSize: 11,
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
                  padding: "0.25rem 0.75rem",
                  borderRadius: 6,
                  fontSize: 11,
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

        {/* Imagem */}
        <div
          style={{
            width: "100%",
            height: "200px",
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: "#f3f4f6",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading ? (
            <div style={{ color: "#6b7280", fontSize: 14 }}>Carregando...</div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={produto.nome}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div style={{ color: "#9ca3af", fontSize: 14 }}>Sem imagem</div>
          )}
        </div>

        {/* Informações */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 600,
              marginBottom: "0.5rem",
              color: "#111827",
            }}
          >
            {produto.nome}
          </h3>
          {produto.descricao && (
            <p
              style={{
                fontSize: 14,
                color: "#6b7280",
                marginBottom: "1rem",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {produto.descricao}
            </p>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "auto",
            }}
          >
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: produto.isTfp ? "#92400e" : "#111827",
              }}
            >
              {formatPrice(produto.preco)}
            </span>
            <span
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                backgroundColor: "#111827",
                color: "#fff",
              }}
            >
              Ver detalhes →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

