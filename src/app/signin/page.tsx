// src/app/signin/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInForm() {
  const [activeTab, setActiveTab] = useState<"magic" | "password">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicInput, setMagicInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const userRole = (session.user as any)?.role;
      const callbackUrl = searchParams.get("callbackUrl");
      
      // Redirecionar por role
      if (userRole === "ARQUITETO") {
        router.push(callbackUrl || "/arquiteto/home");
      } else if (userRole === "ADMIN") {
        router.push(callbackUrl || "/admin/reports");
      } else if (userRole === "MODELO") {
        router.push(callbackUrl || "/modelo/home");
      } else if (userRole === "CLIENTE") {
        router.push(callbackUrl || "/cliente/home");
      } else {
        router.push(callbackUrl || "/");
      }
    }
  }, [status, session, router, searchParams]);

  // Limpa cookies antigos se solicitado
  useEffect(() => {
    const clearCookies = searchParams.get("clearCookies");
    if (clearCookies === "1") {
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
        document.cookie = `${name}=; path=/; max-age=0;`;
        document.cookie = `${name}=; path=/; domain=${window.location.hostname}; max-age=0;`;
        document.cookie = `${name}=; path=/; domain=.${window.location.hostname}; max-age=0;`;
      });

      localStorage.clear();
      sessionStorage.clear();
      console.log("[SignIn] Cookies antigos limpos devido a build novo");
    }
  }, [searchParams]);

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
        console.error("[SignIn] Erro no login:", result.error);
        setErrorMessage("Email ou senha incorretos. Tente novamente.");
        setIsSubmitting(false);
        return;
      }

      if (result?.ok) {
        console.log("[SignIn] Login bem-sucedido, redirecionando...");
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
          console.warn("[SignIn] Erro ao buscar sessão após login:", fetchErr);
          router.push(callbackUrl || "/");
          router.refresh();
        }
        
        return;
      }

      console.warn("[SignIn] Resposta inesperada do signIn:", result);
      setErrorMessage("Erro inesperado. Tente novamente.");
      setIsSubmitting(false);
    } catch (err: any) {
      console.error("[SignIn] Erro ao fazer login:", err);
      setErrorMessage(err.message || "Erro ao fazer login. Tente novamente.");
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleMagicSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Apenas visual - mostra toast
    alert("Funcionalidade em desenvolvimento. Use o login com senha.");
  }

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
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: "#111827" }}>
            TNA Studio
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            Acesse sua conta
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          borderBottom: "1px solid #e5e7eb",
        }}>
          <button
            type="button"
            onClick={() => setActiveTab("magic")}
            style={{
              flex: 1,
              padding: "0.75rem",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "magic" ? "2px solid #111827" : "2px solid transparent",
              color: activeTab === "magic" ? "#111827" : "#6b7280",
              fontWeight: activeTab === "magic" ? 600 : 400,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Código Mágico
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("password")}
            style={{
              flex: 1,
              padding: "0.75rem",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "password" ? "2px solid #111827" : "2px solid transparent",
              color: activeTab === "password" ? "#111827" : "#6b7280",
              fontWeight: activeTab === "password" ? 600 : 400,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Login com Senha
          </button>
        </div>

        {/* Tab: Código Mágico */}
        {activeTab === "magic" && (
          <form onSubmit={handleMagicSubmit} style={{ display: "grid", gap: 16 }}>
            <div style={{
              padding: "1rem",
              background: "#fef3c7",
              border: "1px solid #fbbf24",
              borderRadius: 8,
              fontSize: 13,
              color: "#92400e",
            }}>
              <strong>Em breve:</strong> Indique seu celular, WhatsApp ou e-mail para receber seu código de acesso.
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Celular, WhatsApp ou E-mail</span>
              <input
                type="text"
                value={magicInput}
                onChange={(e) => setMagicInput(e.target.value)}
                placeholder="+5561999999999 ou email@exemplo.com"
                disabled
                style={{
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  background: "#f9fafb",
                  color: "#6b7280",
                  cursor: "not-allowed",
                }}
              />
            </label>

            <button
              type="submit"
              disabled
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                background: "#9ca3af",
                color: "white",
                fontWeight: 600,
                cursor: "not-allowed",
                fontSize: 14,
              }}
            >
              Enviar código (Em breve)
            </button>
          </form>
        )}

        {/* Tab: Login com Senha */}
        {activeTab === "password" && (
          <form onSubmit={onSubmitPassword} style={{ display: "grid", gap: 12 }}>
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
              }}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>

            <div style={{ fontSize: 13, marginTop: 8, textAlign: "center" }}>
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Funcionalidade em desenvolvimento.");
                }}
                style={{ color: "#6b7280", textDecoration: "none", display: "block", marginBottom: 8 }}
              >
                Esqueci minha senha – Em breve
              </Link>
              <div style={{ color: "#6b7280" }}>
                Ainda não está cadastrado?{" "}
                <Link
                  href="/signup"
                  style={{ color: "#111827", textDecoration: "none", fontWeight: 600 }}
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </form>
        )}

        <div style={{ marginTop: 16, fontSize: 13, textAlign: "center" }}>
          <Link href="/" style={{ color: "#6b7280", textDecoration: "none" }}>
            Voltar ao início
          </Link>
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
