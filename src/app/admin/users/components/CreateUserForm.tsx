"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type Props = {
  roles: string[];
};

export default function CreateUserForm({ roles }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: roles[0] ?? "MODEL" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao criar usuário.");
      return;
    }

    setForm({ name: "", email: "", password: "", role: form.role });
    setSuccess("Usuário criado com sucesso.");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "grid",
        gap: "0.85rem",
        background: "#fff",
        borderRadius: 12,
        padding: "1.25rem",
        border: "1px solid #e5e7eb",
      }}
    >
      <div>
        <label style={{ fontSize: 14, fontWeight: 500 }}>Nome</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nome completo"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={{ fontSize: 14, fontWeight: 500 }}>Email *</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="usuario@tna.studio"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={{ fontSize: 14, fontWeight: 500 }}>Senha *</label>
        <input
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Senha temporária"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={{ fontSize: 14, fontWeight: 500 }}>Perfil</label>
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          style={{ ...inputStyle, appearance: "auto" }}
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role.toLowerCase()}
            </option>
          ))}
        </select>
      </div>
      {error && <p style={{ color: "#b91c1c", fontSize: 14 }}>{error}</p>}
      {success && <p style={{ color: "#059669", fontSize: 14 }}>{success}</p>}
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "0.75rem",
          borderRadius: 10,
          background: "#111827",
          color: "#fff",
          fontWeight: 600,
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Criando..." : "Adicionar usuário"}
      </button>
      <p style={{ fontSize: 12, color: "#6b7280" }}>
        * campos obrigatórios · as senhas criadas aqui podem ser trocadas pelo usuário em breve.
      </p>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  marginTop: "0.35rem",
};

