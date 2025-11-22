"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

type Props = {
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
};

export default function ResetPasswordButton({ userId, userEmail, userName }: Props) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Apenas ARQUITETO pode resetar senhas
  if (userRole !== "ARQUITETO") {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validações
    if (!password || password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/arquiteto/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao resetar senha.");
        return;
      }

      setSuccess(`Senha da modelo ${userEmail || userName || userId} atualizada com sucesso.`);
      setPassword("");
      setConfirmPassword("");
      
      // Fecha modal após 2 segundos
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Erro ao resetar senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: "0.5rem 1rem",
          background: "#dc2626",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          marginLeft: "0.5rem",
        }}
      >
        Resetar Senha
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: 12,
              maxWidth: 500,
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Resetar Senha</h2>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: "1.5rem" }}>
              Resetar senha para: <strong>{userEmail || userName || userId}</strong>
            </p>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                  Nova Senha *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  minLength={8}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.75rem",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                  Confirmar Senha *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a senha"
                  minLength={8}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.75rem",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                  }}
                />
              </div>

              {error && (
                <div style={{ padding: "0.75rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", fontSize: 14 }}>
                  {error}
                </div>
              )}

              {success && (
                <div style={{ padding: "0.75rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#065f46", fontSize: 14 }}>
                  {success}
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "transparent",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: loading ? "#9ca3af" : "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  {loading ? "Salvando..." : "Confirmar Reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

