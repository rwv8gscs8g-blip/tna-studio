"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: "100dvh",
      display: "grid",
      placeItems: "center",
      padding: "2rem",
      background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 480,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: "2rem",
        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
        textAlign: "center",
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: "#111827" }}>
          Cadastro
        </h1>
        <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 14 }}>
          O cadastro de novos usuários é feito exclusivamente pelo Arquiteto responsável.
        </p>
        <div style={{
          padding: "1rem",
          background: "#fef3c7",
          border: "1px solid #fbbf24",
          borderRadius: 8,
          fontSize: 13,
          color: "#92400e",
          marginBottom: 24,
        }}>
          <strong>Em breve:</strong> Você poderá solicitar seu cadastro diretamente aqui.
        </div>
        <Link
          href="/signin"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "#111827",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Voltar para Login
        </Link>
      </div>
    </div>
  );
}

