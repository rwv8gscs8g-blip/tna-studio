"use client";

import { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ProfileFormComplete() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [passport, setPassport] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Verificar role do usuário para determinar campos editáveis
  const userRole = (session?.user as any)?.role;
  const isClient = userRole === "CLIENTE";
  const isAdmin = userRole === "ADMIN";
  const isModelo = userRole === "MODELO";
  
  // ADMIN e MODELO não podem editar campos estruturais (email, role, CPF)
  const canEditPersonalData = !isAdmin && !isModelo;

  // Carregar dados do usuário
  useEffect(() => {
    async function loadUserData() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setPhone(data.phone || "");
          setCpf(data.cpf || "");
          setPassport(data.passport || "");
          if (data.birthDate) {
            const date = new Date(data.birthDate);
            setBirthDate(date.toISOString().split("T")[0]);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    if (password && password !== confirmPassword) {
      setStatus("error");
      setMessage("As senhas não conferem.");
      return;
    }

    if (password && password.length < 8) {
      setStatus("error");
      setMessage("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    // ADMIN e MODELO não podem alterar dados pessoais
    if (!canEditPersonalData) {
      setStatus("error");
      setMessage("Você não tem permissão para alterar dados pessoais. Apenas o responsável pode fazer alterações.");
      return;
    }
    
    // CLIENT não pode alterar CPF
    if (isClient && cpf) {
      setStatus("error");
      setMessage("Clientes não podem alterar o CPF. O CPF é usado como chave para suas galerias.");
      return;
    }

    // Validar CPF se fornecido
    if (cpf && cpf.replace(/\D/g, "").length !== 11) {
      setStatus("error");
      setMessage("CPF inválido. Deve ter 11 dígitos.");
      return;
    }

    // Validar telefone se fornecido (formato E.164)
    if (phone && !phone.startsWith("+")) {
      setStatus("error");
      setMessage("Telefone deve estar no formato internacional (+CC DDD Número).");
      return;
    }

    // Validar data de nascimento (>= 18 anos)
    if (birthDate) {
      const birth = new Date(birthDate);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (age < 18 || (age === 18 && monthDiff < 0) || (age === 18 && monthDiff === 0 && today.getDate() < birth.getDate())) {
        setStatus("error");
        setMessage("Você deve ter pelo menos 18 anos.");
        return;
      }
    }

    const res = await fetch("/api/profile/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        phone: phone.trim() || null,
        cpf: isClient ? undefined : (cpf.replace(/\D/g, "") || null), // CLIENT não envia CPF
        passport: passport.trim() || null,
        birthDate: birthDate || null,
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

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Carregando...</div>;
  }

  return (
    <form
      onSubmit={canEditPersonalData ? onSubmit : (e) => { e.preventDefault(); }}
      style={{
        display: "grid",
        gap: "1.5rem",
        padding: "1.5rem",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#fff",
      }}
    >
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: "1rem" }}>Dados Pessoais</h3>
        <div style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>
              Nome completo {canEditPersonalData && "*"}
              {!canEditPersonalData && " (não editável)"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => canEditPersonalData && setName(e.target.value)}
              placeholder="Seu nome completo"
              required={canEditPersonalData}
              disabled={!canEditPersonalData}
              style={{
                ...inputStyle,
                ...(!canEditPersonalData ? { background: "#f9fafb", cursor: "not-allowed", color: "#6b7280" } : {}),
              }}
            />
            {!canEditPersonalData && (
              <p style={{ fontSize: 12, color: "#6b7280", marginTop: "0.25rem" }}>
                Este campo não pode ser alterado neste perfil.
              </p>
            )}
          </div>
          <div>
            <label style={labelStyle}>
              Telefone (formato internacional)
              {!canEditPersonalData && " (não editável)"}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => canEditPersonalData && setPhone(e.target.value)}
              placeholder="+5561999999999"
              disabled={!canEditPersonalData}
              style={{
                ...inputStyle,
                ...(!canEditPersonalData ? { background: "#f9fafb", cursor: "not-allowed", color: "#6b7280" } : {}),
              }}
            />
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: "0.25rem" }}>
              Formato: +CC DDD Número (ex: +5561999999999)
            </p>
          </div>
          <div>
            <label style={labelStyle}>
              CPF (apenas números)
              {(isClient || !canEditPersonalData) && " (não pode ser alterado)"}
            </label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => canEditPersonalData && !isClient && setCpf(e.target.value.replace(/\D/g, ""))}
              placeholder="00000000000"
              maxLength={11}
              disabled={isClient || !canEditPersonalData}
              style={{
                ...inputStyle,
                ...((isClient || !canEditPersonalData) ? { background: "#f9fafb", cursor: "not-allowed", color: "#6b7280" } : {}),
              }}
            />
            {(isClient || !canEditPersonalData) && (
              <p style={{ fontSize: 12, color: "#6b7280", marginTop: "0.25rem" }}>
                {isClient 
                  ? "Clientes não podem alterar o CPF. O CPF é usado como chave para suas galerias."
                  : "Este campo não pode ser alterado neste perfil."}
              </p>
            )}
          </div>
          <div>
            <label style={labelStyle}>
              Passaporte (se não tiver CPF)
              {!canEditPersonalData && " (não editável)"}
            </label>
            <input
              type="text"
              value={passport}
              onChange={(e) => canEditPersonalData && setPassport(e.target.value.toUpperCase())}
              placeholder="AB1234567"
              disabled={!canEditPersonalData}
              style={{
                ...inputStyle,
                ...(!canEditPersonalData ? { background: "#f9fafb", cursor: "not-allowed", color: "#6b7280" } : {}),
              }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Data de Nascimento
              {!canEditPersonalData && " (não editável)"}
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => canEditPersonalData && setBirthDate(e.target.value)}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
              disabled={!canEditPersonalData}
              style={{
                ...inputStyle,
                ...(!canEditPersonalData ? { background: "#f9fafb", cursor: "not-allowed", color: "#6b7280" } : {}),
              }}
            />
            {birthDate && (
              <p style={{ fontSize: 12, color: "#6b7280", marginTop: "0.25rem" }}>
                Idade atual: {(() => {
                  const birth = new Date(birthDate);
                  const today = new Date();
                  let age = today.getFullYear() - birth.getFullYear();
                  const monthDiff = today.getMonth() - birth.getMonth();
                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                    age--;
                  }
                  return age;
                })()} anos
              </p>
            )}
            {canEditPersonalData && (
              <p style={{ fontSize: 12, color: "#6b7280", marginTop: "0.25rem" }}>
                Você deve ter pelo menos 18 anos
              </p>
            )}
          </div>
        </div>
      </div>

      {canEditPersonalData && (
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: "1rem" }}>Segurança</h3>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Nova senha</label>
              <input
                type="password"
                value={password}
                minLength={8}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres (maiúscula, minúscula, número, símbolo)"
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
          </div>
        </div>
      )}

      {message && (
        <div
          style={{
            padding: "1rem",
            borderRadius: 8,
            background: status === "error" ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${status === "error" ? "#fecaca" : "#bbf7d0"}`,
            color: status === "error" ? "#991b1b" : "#065f46",
          }}
        >
          {message}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          // Para ADMIN e MODELO, apenas visualizar - não faz submit
          if (!canEditPersonalData) {
            setMessage("Você está visualizando seus dados. Apenas o Arquiteto pode fazer alterações.");
            return;
          }
        }}
        disabled={status === "loading" || !canEditPersonalData}
        style={{
          padding: "0.9rem",
          borderRadius: 10,
          border: "none",
          background: (status === "loading" || !canEditPersonalData) ? "#9ca3af" : "#111827",
          color: "#fff",
          fontWeight: 600,
          cursor: (status === "loading" || !canEditPersonalData) ? "not-allowed" : "pointer",
          fontSize: 16,
        }}
      >
        {status === "loading" 
          ? "Salvando..." 
          : !canEditPersonalData
          ? "Ver Dados"
          : "Salvar alterações"}
      </button>
      
      {!canEditPersonalData && (
        <div style={{ 
          padding: "1rem", 
          background: "#fef3c7", 
          border: "1px solid #fbbf24", 
          borderRadius: 8,
          fontSize: 13,
          color: "#92400e",
          textAlign: "center"
        }}>
          <strong>ℹ️ Informação:</strong> Seus dados pessoais foram cadastrados e só podem ser atualizados pelo Arquiteto responsável pelo ensaio.
        </div>
      )}
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  marginTop: "0.35rem",
  fontSize: 14,
};

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  display: "block",
};

