"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ModeloSignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);

    // Validações básicas
    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }

    if (!email.trim()) {
      setError("Email é obrigatório.");
      return;
    }

    if (!password || password.length < 8) {
      setError("Senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    // Validações adicionais
    const normalizedCpf = cpf.replace(/\D/g, "");
    if (!normalizedCpf || normalizedCpf.length !== 11) {
      setError("CPF é obrigatório e deve ter 11 dígitos.");
      return;
    }

    if (!phone.trim()) {
      setError("Telefone é obrigatório.");
      return;
    }

    if (!birthDate) {
      setError("Data de nascimento é obrigatória.");
      return;
    }

    // Validar idade mínima
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    if (age < 18) {
      setError("Você deve ter pelo menos 18 anos para se cadastrar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup/modelo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          cpf: normalizedCpf,
          phone: phone.trim(),
          birthDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar conta.");
      }

      // Sucesso - redireciona para login
      router.push("/signin?message=Conta criada com sucesso! Faça login.");
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta. Tente novamente.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "1.25rem 1.5rem",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
          Criar Conta - Modelo
        </h1>
        <p style={{ color: "#6b7280", marginBottom: 16 }}>
          Preencha seus dados para se cadastrar.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 14 }}>Nome completo</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
              style={{
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 14 }}>E-mail</span>
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
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 14 }}>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={isSubmitting}
              style={{
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
              }}
            />
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Mínimo de 8 caracteres
            </span>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 14 }}>Confirmar senha</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
              style={{
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 14 }}>CPF *</span>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
              maxLength={11}
              placeholder="00000000000"
              required
              disabled={isSubmitting}
              style={{
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
              }}
            />
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              11 dígitos, apenas números
            </span>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 14 }}>Telefone *</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+5561999999999"
              required
              disabled={isSubmitting}
              style={{
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
              }}
            />
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Formato: +5561999999999
            </span>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 14 }}>Data de nascimento *</span>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
              disabled={isSubmitting}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
              style={{
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
              }}
            />
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Mínimo 18 anos
            </span>
          </label>

          {error && (
            <div
              style={{
                color: "#b91c1c",
                fontSize: 14,
                padding: "8px 12px",
                backgroundColor: "#fee2e2",
                borderRadius: 6,
                border: "1px solid #fecaca",
              }}
            >
              {error}
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
            }}
          >
            {isSubmitting ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <div style={{ marginTop: 16, fontSize: 14, textAlign: "center" }}>
          <p style={{ color: "#6b7280" }}>
            Já tem uma conta?{" "}
            <Link href="/signin" style={{ color: "#111827", fontWeight: 600 }}>
              Fazer login
            </Link>
          </p>
          <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 8 }}>
            Ao criar conta, você não poderá alterar seus dados. Apenas o responsável poderá gerenciar seu perfil.
            <br />
            <strong>Campos obrigatórios:</strong> Nome, Email, Senha, CPF, Telefone e Data de Nascimento.
          </p>
        </div>
      </div>
    </div>
  );
}

