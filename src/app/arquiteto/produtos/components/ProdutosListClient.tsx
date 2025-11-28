"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CurrencyDisplay from "@/app/components/CurrencyDisplay";

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
  precoEuro: number | null;
  categoria: string | null;
  isActive: boolean;
  coverImageKey: string | null;
  displayOrder: number;
  photos: ProdutoPhoto[];
  _count: {
    ensaios: number;
    intencoes: number;
  };
}

interface ProdutosListClientProps {
  produtos: Produto[];
}

export default function ProdutosListClient({ produtos }: ProdutosListClientProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${nome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/produtos/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir produto");
      }

      router.refresh();
    } catch (error: any) {
      alert(`Erro ao excluir produto: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
            <th style={{ padding: "1rem", textAlign: "left", fontSize: 14, fontWeight: 600, color: "#111827" }}>
              Imagem
            </th>
            <th style={{ padding: "1rem", textAlign: "left", fontSize: 14, fontWeight: 600, color: "#111827" }}>
              Nome
            </th>
            <th style={{ padding: "1rem", textAlign: "left", fontSize: 14, fontWeight: 600, color: "#111827" }}>
              Preço
            </th>
            <th style={{ padding: "1rem", textAlign: "left", fontSize: 14, fontWeight: 600, color: "#111827" }}>
              Categoria
            </th>
            <th style={{ padding: "1rem", textAlign: "left", fontSize: 14, fontWeight: 600, color: "#111827" }}>
              Ordem
            </th>
            <th style={{ padding: "1rem", textAlign: "left", fontSize: 14, fontWeight: 600, color: "#111827" }}>
              Status
            </th>
            <th style={{ padding: "1rem", textAlign: "right", fontSize: 14, fontWeight: 600, color: "#111827" }}>
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {produtos.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>
                Nenhum produto cadastrado.{" "}
                <Link href="/arquiteto/produtos/novo" style={{ color: "#111827", fontWeight: 600 }}>
                  Criar primeiro produto
                </Link>
              </td>
            </tr>
          ) : (
            produtos.map((produto) => (
              <tr
                key={produto.id}
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                }}
              >
                <td style={{ padding: "1rem" }}>
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: 8,
                      overflow: "hidden",
                      background: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {produto.coverImageKey || produto.photos[0] ? (
                      <img
                        src={`/api/produtos/${produto.id}/cover`}
                        alt={produto.nome}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div style="color: #9ca3af; font-size: 12px;">Sem imagem</div>';
                        }}
                      />
                    ) : (
                      <div style={{ color: "#9ca3af", fontSize: 12 }}>Sem imagem</div>
                    )}
                  </div>
                </td>
                <td style={{ padding: "1rem" }}>
                  <div style={{ fontWeight: 600, color: "#111827", marginBottom: "0.25rem" }}>
                    {produto.nome}
                  </div>
                  {produto.shortDescription && (
                    <div style={{ fontSize: 12, color: "#6b7280", maxWidth: "300px" }}>
                      {produto.shortDescription.length > 60
                        ? `${produto.shortDescription.substring(0, 60)}...`
                        : produto.shortDescription}
                    </div>
                  )}
                </td>
                <td style={{ padding: "1rem" }}>
                  <CurrencyDisplay valueEuro={produto.precoEuro} showBase={false} showNote={false} />
                </td>
                <td style={{ padding: "1rem" }}>
                  {produto.categoria ? (
                    <span
                      style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: produto.categoria === "Cortesia" ? "#fef3c7" : "#dcfce7",
                        color: produto.categoria === "Cortesia" ? "#92400e" : "#166534",
                        textTransform: "uppercase",
                      }}
                    >
                      {produto.categoria}
                    </span>
                  ) : (
                    <span style={{ color: "#9ca3af" }}>—</span>
                  )}
                </td>
                <td style={{ padding: "1rem" }}>
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      backgroundColor: produto.isActive ? "#dcfce7" : "#f3f4f6",
                      color: produto.isActive ? "#166534" : "#6b7280",
                    }}
                  >
                    {produto.isActive ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td style={{ padding: "1rem", textAlign: "right" }}>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <Link
                      href={`/arquiteto/produtos/${produto.id}`}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: 8,
                        background: "#2563eb",
                        color: "#fff",
                        textDecoration: "none",
                        fontSize: 13,
                        fontWeight: 500,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#1d4ed8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#2563eb";
                      }}
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(produto.id, produto.nome)}
                      disabled={deletingId === produto.id}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: 8,
                        background: deletingId === produto.id ? "#9ca3af" : "#dc2626",
                        color: "#fff",
                        border: "none",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: deletingId === produto.id ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (deletingId !== produto.id) {
                          e.currentTarget.style.background = "#b91c1c";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (deletingId !== produto.id) {
                          e.currentTarget.style.background = "#dc2626";
                        }
                      }}
                    >
                      {deletingId === produto.id ? "Excluindo..." : "Excluir"}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

