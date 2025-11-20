"use client";

import { useState, FormEvent } from "react";

type Props = {
  defaultName: string | null | undefined;
};

export default function ProfileForm({ defaultName }: Props) {
  const [name, setName] = useState(defaultName ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    if (password && password !== confirmPassword) {
      setStatus("error");
      setMessage("As senhas não conferem.");
      return;
    }

    if (!name.trim() && !password) {
      setStatus("error");
      setMessage("Informe um novo nome ou senha.");
      return;
    }

    const res = await fetch("/api/profile/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        password: password || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus("error");
      setMessage(data.error ?? "Não foi possível atualizar.");
      return;
    }

    setStatus("success");
    setMessage("Perfil atualizado com sucesso.");
    if (password) {
      setPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "grid",
        gap: "1rem",
        padding: "1.5rem",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#fff",
      }}
    >
      <div>
        <label style={labelStyle}>Nome completo</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Nova senha</label>
        <input
          type="password"
          value={password}
          minLength={8}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Confirmar nova senha</label>
        <input
          type="password"
          value={confirmPassword}
          minLength={8}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repita a nova senha"
          style={inputStyle}
        />
      </div>
      {message && (
        <p
          style={{
            color: status === "error" ? "#b91c1c" : "#059669",
            fontSize: 14,
          }}
        >
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          padding: "0.9rem",
          borderRadius: 10,
          border: "none",
          background: "#111827",
          color: "#fff",
          fontWeight: 600,
          cursor: status === "loading" ? "not-allowed" : "pointer",
        }}
      >
        {status === "loading" ? "Salvando..." : "Salvar alterações"}
      </button>
      <p style={{ fontSize: 12, color: "#6b7280" }}>
        Dica: troque a senha regularmente e mantenha seus dados atualizados.
      </p>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  marginTop: "0.35rem",
};

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
};

