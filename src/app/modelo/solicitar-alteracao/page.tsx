"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ChangeRequest {
  id: string;
  campo: string;
  valorAntigo: string | null;
  valorNovo: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  motivoRejeicao: string | null;
  createdAt: string;
}

export default function SolicitarAlteracaoPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  
  // Campos editáveis
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [nameSocial, setNameSocial] = useState("");
  const [passport, setPassport] = useState("");
  const [email, setEmail] = useState("");
  const [selectedField, setSelectedField] = useState<string>("");

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/signin");
      return;
    }

    const userRole = (session?.user as any)?.role;
    if (userRole !== "MODELO" && userRole !== "CLIENTE") {
      router.push("/");
      return;
    }

    loadUserData();
    loadRequests();
  }, [session, sessionStatus, router]);

  async function loadUserData() {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setNameSocial(data.name || "");
        setPassport(data.passport || "");
        setEmail(data.email || "");
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadRequests() {
    try {
      const res = await fetch("/api/modelo/solicitacoes");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Erro ao carregar solicitações:", err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedField) {
      setError("Selecione um campo para solicitar alteração.");
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      let valorNovo = "";
      let valorAntigo = "";

      switch (selectedField) {
        case "phone":
          valorNovo = phone;
          valorAntigo = userData?.phone || "";
          break;
        case "address":
          valorNovo = address;
          valorAntigo = userData?.address || "";
          break;
        case "name":
          valorNovo = nameSocial;
          valorAntigo = userData?.name || "";
          break;
        case "passport":
          valorNovo = passport;
          valorAntigo = userData?.passport || "";
          break;
        case "email":
          valorNovo = email;
          valorAntigo = userData?.email || "";
          break;
      }

      if (valorNovo === valorAntigo) {
        setError("O novo valor deve ser diferente do valor atual.");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/modelo/solicitacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campo: selectedField,
          valorNovo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar solicitação.");
        setSubmitting(false);
        return;
      }

      setSuccess("Solicitação criada com sucesso! Aguarde aprovação do responsável pelo sistema.");
      setSelectedField("");
      await loadRequests();
      setSubmitting(false);
    } catch (err: any) {
      setError(err.message || "Erro ao criar solicitação.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Carregando...</p>
      </div>
    );
  }

  const fieldLabels: Record<string, string> = {
    phone: "Telefone",
    address: "Endereço",
    name: "Nome Social",
    passport: "Passaporte",
    email: "E-mail Principal",
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: "0.5rem" }}>
          Solicitar Alteração de Dados
        </h1>
        <p style={{ color: "#6b7280" }}>
          Solicite alterações nos seus dados. O responsável pelo sistema revisará e aprovará sua solicitação.
        </p>
      </header>

      <div
        style={{
          background: "#fef3c7",
          border: "1px solid #fbbf24",
          borderRadius: 8,
          padding: "1rem",
          marginBottom: "2rem",
          fontSize: 14,
          color: "#92400e",
        }}
      >
        <strong>⚠️ Importante:</strong> Você não pode alterar seu CPF. Para alterar outros dados, selecione o campo abaixo e preencha o novo valor.
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: "0.5rem" }}>
            Campo que deseja alterar *
          </label>
          <select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            <option value="">Selecione um campo</option>
            <option value="phone">Telefone</option>
            <option value="address">Endereço</option>
            <option value="name">Nome Social</option>
            <option value="passport">Passaporte</option>
            <option value="email">E-mail Principal</option>
          </select>
        </div>

        {selectedField === "phone" && (
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: "0.5rem" }}>
              Novo Telefone *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+5561999999999"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
              }}
            />
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: "0.25rem" }}>
              Formato: +CC DDD Número (ex: +5561999999999)
            </p>
          </div>
        )}

        {selectedField === "address" && (
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: "0.5rem" }}>
              Novo Endereço *
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, complemento, bairro, cidade, estado, CEP"
              required
              rows={3}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
                fontFamily: "inherit",
              }}
            />
          </div>
        )}

        {selectedField === "name" && (
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: "0.5rem" }}>
              Novo Nome Social *
            </label>
            <input
              type="text"
              value={nameSocial}
              onChange={(e) => setNameSocial(e.target.value)}
              placeholder="Nome completo"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </div>
        )}

        {selectedField === "passport" && (
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: "0.5rem" }}>
              Novo Passaporte *
            </label>
            <input
              type="text"
              value={passport}
              onChange={(e) => setPassport(e.target.value.toUpperCase())}
              placeholder="AB1234567"
              required
              maxLength={9}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
              }}
            />
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: "0.25rem" }}>
              Formato: 2 letras + 6-9 alfanuméricos (ICAO)
            </p>
          </div>
        )}

        {selectedField === "email" && (
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: "0.5rem" }}>
              Novo E-mail Principal *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="novo@email.com"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </div>
        )}

        {error && (
          <div style={{
            padding: "0.75rem",
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            color: "#991b1b",
            fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: "0.75rem",
            background: "#dcfce7",
            border: "1px solid #bbf7d0",
            borderRadius: 8,
            color: "#166534",
            fontSize: 14,
          }}>
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !selectedField}
          style={{
            padding: "0.75rem 1.5rem",
            background: (submitting || !selectedField) ? "#9ca3af" : "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: (submitting || !selectedField) ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Enviando..." : "Solicitar Alteração"}
        </button>
      </form>

      {/* Histórico de solicitações */}
      <div style={{ marginTop: "3rem" }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem" }}>
          Histórico de Solicitações
        </h2>
        {requests.length === 0 ? (
          <p style={{ color: "#6b7280" }}>Nenhuma solicitação ainda.</p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {requests.map((req) => (
              <div
                key={req.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "1rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                  <div>
                    <strong>{fieldLabels[req.campo] || req.campo}</strong>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: "0.25rem" }}>
                      {req.valorAntigo && (
                        <span>De: {req.valorAntigo} → Para: {req.valorNovo}</span>
                      )}
                      {!req.valorAntigo && (
                        <span>Novo valor: {req.valorNovo}</span>
                      )}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      background:
                        req.status === "APPROVED"
                          ? "#dcfce7"
                          : req.status === "REJECTED"
                          ? "#fee2e2"
                          : "#fef3c7",
                      color:
                        req.status === "APPROVED"
                          ? "#166534"
                          : req.status === "REJECTED"
                          ? "#991b1b"
                          : "#92400e",
                    }}
                  >
                    {req.status === "PENDING" && "Pendente"}
                    {req.status === "APPROVED" && "Aprovada"}
                    {req.status === "REJECTED" && "Rejeitada"}
                  </span>
                </div>
                {req.motivoRejeicao && (
                  <div style={{ fontSize: 13, color: "#991b1b", marginTop: "0.5rem" }}>
                    <strong>Motivo da rejeição:</strong> {req.motivoRejeicao}
                  </div>
                )}
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: "0.5rem" }}>
                  {new Date(req.createdAt).toLocaleString("pt-BR")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <Link
          href="/modelo/home"
          style={{
            color: "#6b7280",
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          ← Voltar para Home
        </Link>
      </div>
    </div>
  );
}

