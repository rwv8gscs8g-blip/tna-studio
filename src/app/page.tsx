"use client";
import { signOut } from "next-auth/react";

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        background: "#fafafa",
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 12 }}>Área restrita</h1>
      <p style={{ fontSize: 18, marginBottom: 24 }}>
        Você está logado com sucesso!
      </p>

      <button
        onClick={() => signOut({ callbackUrl: "/signin" })}
        style={{
          background: "#111",
          color: "#fff",
          padding: "12px 24px",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        Sair
      </button>
    </div>
  );
}