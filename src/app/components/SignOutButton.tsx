"use client";

import { signOut } from "next-auth/react";
import { useTransition, useState } from "react";

type Props = {
  label?: string;
  variant?: "solid" | "ghost";
};

export default function SignOutButton({
  label = "Sair",
  variant = "solid",
}: Props) {
  const [pending, startTransition] = useTransition();
  const [showLogoutMessage, setShowLogoutMessage] = useState(false);

  const styles =
    variant === "ghost"
      ? {
          background: "transparent",
          color: "#111827",
          border: "1px solid #e5e7eb",
        }
      : { background: "#111827", color: "#fff", border: "none" };

  // Usa mesma lógica do SessionTimer: mostra mensagem por 2s e depois redireciona
  const handleLogout = () => {
    startTransition(async () => {
      try {
        // Mostra mensagem de logout
        setShowLogoutMessage(true);
        
        // Limpa storage primeiro
        sessionStorage.clear();
        localStorage.clear();
        
        // Limpa todos os cookies no cliente
        const cookies = document.cookie.split(";");
        cookies.forEach((cookie) => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name) {
            // Remove com diferentes paths e domains
            const hostname = window.location.hostname;
            const paths = ["/", ""];
            const domains = [hostname, `.${hostname}`, ""];
            
            paths.forEach((path) => {
              domains.forEach((domain) => {
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain}`;
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain};secure`;
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain};samesite=lax`;
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain};samesite=strict`;
              });
            });
          }
        });
        
        // Chama API de logout
        try {
          await fetch("/api/auth/logout", { 
            method: "POST",
            credentials: "include",
            cache: "no-store"
          });
        } catch (apiError) {
          console.warn("Erro na API de logout, continuando...", apiError);
        }
        
        // Força logout do NextAuth
        try {
          await signOut({ redirect: false });
        } catch (signOutError) {
          console.warn("Erro no signOut, continuando...", signOutError);
        }
        
        // Aguarda 1 segundo e redireciona com cache busting
        setTimeout(() => {
          // Força limpeza completa antes de redirecionar
          document.cookie.split(";").forEach((c) => {
            const name = c.split("=")[0].trim();
            const hostname = window.location.hostname;
            ["", hostname, `.${hostname}`].forEach((d) => {
              ["/", ""].forEach((p) => {
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${p};domain=${d}`;
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${p};domain=${d};secure`;
              });
            });
          });
          localStorage.clear();
          sessionStorage.clear();
          // Redireciona para home pública (sem cache busting para evitar loops)
          window.location.replace(`/?logout=success`);
        }, 1000);
        
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
        // Fallback: redireciona mesmo com erro
        setTimeout(() => {
          window.location.replace("/?logout=success");
        }, 2000);
      }
    });
  };

  // Se está mostrando mensagem de logout, exibe mensagem similar ao SessionTimer
  if (showLogoutMessage) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1rem",
          borderRadius: "8px",
          background: "#fee2e2",
          border: "1px solid #fca5a5",
          fontSize: 14,
          fontWeight: 500,
          color: "#991b1b",
        }}
      >
        <span role="img" aria-label="Aviso">⚠️</span>
        Encerrando sessão...
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      style={{
        padding: "0.65rem 1.25rem",
        borderRadius: 8,
        fontWeight: 600,
        cursor: pending ? "not-allowed" : "pointer",
        opacity: pending ? 0.7 : 1,
        ...styles,
      }}
      disabled={pending}
    >
      {pending ? "Saindo..." : label}
    </button>
  );
}

