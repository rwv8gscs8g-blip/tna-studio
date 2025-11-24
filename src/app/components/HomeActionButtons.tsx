"use client";

import Link from "next/link";

/**
 * Componente Client Component para os botões de ação na home page.
 * Necessário porque Server Components não podem usar event handlers (onMouseEnter/onMouseLeave).
 */
export default function HomeActionButtons() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        marginBottom: "2rem",
      }}
    >
      <Link
        href="/signin"
        style={{
          display: "inline-block",
          background: "#111827",
          color: "#fff",
          padding: "1rem 2rem",
          borderRadius: 10,
          textDecoration: "none",
          fontSize: 16,
          fontWeight: 600,
          transition: "all 0.2s",
          border: "none",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#1f2937";
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#111827";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        Entrar
      </Link>

      <Link
        href="/modelo/signup"
        style={{
          display: "inline-block",
          background: "transparent",
          color: "#111827",
          padding: "1rem 2rem",
          borderRadius: 10,
          textDecoration: "none",
          fontSize: 16,
          fontWeight: 600,
          border: "2px solid #e5e7eb",
          transition: "all 0.2s",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#111827";
          e.currentTarget.style.background = "#f9fafb";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#e5e7eb";
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        Criar Conta (Modelo)
      </Link>
    </div>
  );
}

