// src/app/signin/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  // Limpa cookies antigos se solicitado
  useEffect(() => {
    const clearCookies = searchParams.get("clearCookies");
    if (clearCookies === "1") {
      // Limpa todos os cookies de sessão no cliente
      const cookieNames = [
        "next-auth.session-token",
        "__Secure-next-auth.session-token",
        "next-auth.csrf-token",
        "__Secure-next-auth.csrf-token",
        "next-auth.callback-url",
        "__Secure-next-auth.callback-url",
        "sessionToken",
      ];

      cookieNames.forEach((name) => {
        // Remove cookie do domínio atual
        document.cookie = `${name}=; path=/; max-age=0;`;
        document.cookie = `${name}=; path=/; domain=${window.location.hostname}; max-age=0;`;
        document.cookie = `${name}=; path=/; domain=.${window.location.hostname}; max-age=0;`;
      });

      // Limpa localStorage e sessionStorage também
      localStorage.clear();
      sessionStorage.clear();

      console.log("[SignIn] Cookies antigos limpos devido a build novo");
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Usa redirect: false para capturar erros antes de redirecionar
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,    // Não redireciona automaticamente para capturar erros
        callbackUrl: "/",
      });

      if (res?.error) {
        // Erro de autenticação
        console.error("[SignIn] Erro no login:", res.error);
        setError("Email ou senha incorretos. Tente novamente.");
        setLoading(false);
        return;
      }

      if (res?.ok) {
        // Login bem-sucedido - redireciona manualmente
        console.log("[SignIn] Login bem-sucedido, redirecionando...");
        window.location.href = res.url || "/";
        return;
      }

      // Se não retornou ok nem error, algo estranho aconteceu
      console.warn("[SignIn] Resposta inesperada do signIn:", res);
      setError("Erro inesperado. Tente novamente.");
      setLoading(false);
    } catch (err: any) {
      console.error("[SignIn] Erro ao fazer login:", err);
      setError(err.message || "Erro ao fazer login. Tente novamente.");
      setLoading(false);
    }
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

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
        <div>Carregando...</div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}