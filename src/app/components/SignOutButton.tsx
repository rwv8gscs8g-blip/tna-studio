"use client";

import { signOut } from "next-auth/react";
import { useTransition } from "react";

type Props = {
  label?: string;
  variant?: "solid" | "ghost";
};

export default function SignOutButton({
  label = "Sair",
  variant = "solid",
}: Props) {
  const [pending, startTransition] = useTransition();

  const styles =
    variant === "ghost"
      ? {
          background: "transparent",
          color: "#111827",
          border: "1px solid #e5e7eb",
        }
      : { background: "#111827", color: "#fff", border: "none" };

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          try {
            // Usa rota customizada que remove todos os cookies
            await fetch("/api/auth/logout", { method: "POST" });
            // Redireciona para signin após logout
            window.location.href = "/signin";
          } catch (error) {
            console.error("Erro ao fazer logout:", error);
            // Fallback: tenta logout padrão
            signOut({ callbackUrl: "/signin" });
          }
        })
      }
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

