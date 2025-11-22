"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateProjetoForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/projetos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, active }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao criar projeto");
      }

      router.push("/projetos");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao criar projeto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        padding: "1.5rem",
      }}
    >
      <div style={{ display: "grid", gap: "1rem" }}>
        <div>
          <label style={{ display: "grid", gap: "0.5rem" }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Nome do Projeto *</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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

        <div>
          <label style={{ display: "grid", gap: "0.5rem" }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Descrição</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={4}
              style={{
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
                resize: "vertical",
              }}
            />
          </label>
        </div>

        <div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              disabled={isSubmitting}
            />
            <span style={{ fontSize: 14, fontWeight: 500 }}>Projeto ativo</span>
          </label>
        </div>

        {error && (
          <div
            style={{
              padding: "0.75rem",
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: 6,
              color: "#991b1b",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: 8,
              background: isSubmitting ? "#6b7280" : "#111827",
              color: "#fff",
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              border: "none",
              fontSize: 14,
            }}
          >
            {isSubmitting ? "Criando..." : "Criar Projeto"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: 8,
              background: "#f3f4f6",
              color: "#111827",
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              border: "1px solid #d1d5db",
              fontSize: 14,
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}

