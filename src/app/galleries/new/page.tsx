/**
 * Página para criar nova galeria
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewGalleryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const isPrivate = formData.get("isPrivate") === "true";

    try {
      const res = await fetch("/api/galleries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          isPrivate,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        router.push(`/galleries/${data.id}`);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao criar galeria");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 600, margin: "0 auto" }}>
      <Link
        href="/galleries"
        style={{
          display: "inline-block",
          marginBottom: "1rem",
          color: "#6b7280",
          textDecoration: "none",
          fontSize: 14,
        }}
      >
        ← Voltar para galerias
      </Link>

      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: "2rem" }}>
        Nova Galeria
      </h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.5rem" }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Título *</span>
          <input
            type="text"
            name="title"
            required
            style={{
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 16,
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Descrição</span>
          <textarea
            name="description"
            rows={4}
            style={{
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 16,
              fontFamily: "inherit",
            }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            name="isPrivate"
            value="true"
            defaultChecked
            style={{ width: 18, height: 18 }}
          />
          <span style={{ fontSize: 14 }}>Galeria privada</span>
        </label>

        {error && (
          <div style={{ color: "#b91c1c", fontSize: 14 }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 24px",
              background: loading ? "#9ca3af" : "#111",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Criando..." : "Criar Galeria"}
          </button>
          <Link
            href="/galleries"
            style={{
              padding: "10px 24px",
              background: "transparent",
              color: "#6b7280",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 16,
              fontWeight: 500,
              display: "inline-block",
            }}
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

