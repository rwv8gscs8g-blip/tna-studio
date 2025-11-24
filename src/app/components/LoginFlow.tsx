"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginFlow() {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function onSubmitPassword(e: React.FormEvent) {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const callbackUrl = searchParams.get("callbackUrl") || "/";
      
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        console.error("[LoginFlow] Erro no login:", result.error);
        setErrorMessage("Email ou senha incorretos. Tente novamente.");
        setIsSubmitting(false);
        return;
      }

      if (result?.ok) {
        console.log("[LoginFlow] Login bem-sucedido, redirecionando...");
        setIsSubmitting(false);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          const response = await fetch("/api/auth/session");
          const sessionData = await response.json();
          const userRole = sessionData?.user?.role;
          
          let redirectUrl = callbackUrl;
          
          if (callbackUrl === "/" || !callbackUrl) {
            if (userRole === "ARQUITETO") {
              redirectUrl = "/arquiteto/ensaios";
            } else if (userRole === "ADMIN") {
              redirectUrl = "/admin/reports";
            } else if (userRole === "MODELO") {
              redirectUrl = "/modelo/home";
            } else if (userRole === "CLIENTE") {
              redirectUrl = "/";
            } else {
              redirectUrl = "/";
            }
          }
          
          router.push(redirectUrl);
          router.refresh();
        } catch (fetchErr: any) {
          console.warn("[LoginFlow] Erro ao buscar sessão após login:", fetchErr);
          router.push(callbackUrl || "/");
          router.refresh();
        }
        
        return;
      }

      console.warn("[LoginFlow] Resposta inesperada do signIn:", result);
      setErrorMessage("Erro inesperado. Tente novamente.");
      setIsSubmitting(false);
    } catch (err: any) {
      console.error("[LoginFlow] Erro ao fazer login:", err);
      setErrorMessage(err.message || "Erro ao fazer login. Tente novamente.");
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!showLoginForm) {
    // Tela inicial com dois botões
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
        <button
          onClick={() => setShowLoginForm(true)}
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
        </button>

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
            textAlign: "center",
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
          Cadastre-se (modelo)
        </Link>

        <p style={{ fontSize: 13, color: "#9ca3af", marginTop: "0.5rem", textAlign: "center" }}>
          Token mágico em breve
        </p>
      </div>
    );
  }

  // Formulário de login
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
      <form onSubmit={onSubmitPassword} style={{ display: "grid", gap: 12 }}>
        <div>
          <button
            type="button"
            onClick={() => setShowLoginForm(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              fontSize: 14,
              marginBottom: "1rem",
              padding: 0,
              textAlign: "left",
            }}
          >
            ← Voltar
          </button>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            style={{
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Senha</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
            style={{
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
            }}
          />
        </label>

        {errorMessage && (
          <div style={{
            color: "#b91c1c",
            fontSize: 14,
            padding: "8px 12px",
            backgroundColor: "#fee2e2",
            borderRadius: 6,
            border: "1px solid #fecaca",
          }}>
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            background: isSubmitting ? "#6b7280" : "#111827",
            color: "white",
            fontWeight: 600,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
            fontSize: 14,
            border: "none",
          }}
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div style={{ fontSize: 13, marginTop: 8, textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ color: "#9ca3af" }}>
          Entrar com token mágico (em breve)
        </div>
        <div style={{ color: "#9ca3af" }}>
          Esqueci minha senha (em breve)
        </div>
      </div>
    </div>
  );
}

