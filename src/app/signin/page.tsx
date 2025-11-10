// src/app/signin/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: true,      // redireciona após sucesso
      callbackUrl: "/",    // pode trocar depois
    });

    // quando redirect=true, o NextAuth redireciona e não retorna erro aqui
    // se preferir tratar sem redirect, defina redirect:false e cheque res?.error
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100dvh",
      display: "grid",
      placeItems: "center",
      padding: "2rem"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "1.25rem 1.5rem"
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
          Entrar
        </h1>
        <p style={{ color: "#6b7280", marginBottom: 16 }}>
          Use seu e-mail e senha.
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 14 }}>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8 }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 14 }}>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8 }}
            />
          </label>

          {error && (
            <div style={{ color: "#b91c1c", fontSize: 14 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              background: "#111827",
              color: "white",
              fontWeight: 600
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div style={{ marginTop: 12, fontSize: 14 }}>
          <Link href="/">Voltar ao início</Link>
        </div>
      </div>
    </div>
  );
}