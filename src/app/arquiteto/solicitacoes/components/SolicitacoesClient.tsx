"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Request {
  id: string;
  campo: string;
  valorAntigo: string | null;
  valorNovo: string;
  status: string;
  createdAt: string;
  User: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

interface SolicitacoesClientProps {
  initialRequests: Request[];
}

const fieldLabels: Record<string, string> = {
  phone: "Telefone",
  address: "Endereço",
  name: "Nome Social",
  passport: "Passaporte",
  email: "E-mail Principal",
};

export default function SolicitacoesClient({ initialRequests }: SolicitacoesClientProps) {
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleAction(requestId: string, action: "approve" | "reject", motivoRejeicao?: string) {
    setProcessing(requestId);
    setError(null);

    try {
      const res = await fetch(`/api/arquiteto/solicitacoes/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          motivoRejeicao,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao processar solicitação.");
        setProcessing(null);
        return;
      }

      // Remover da lista
      setRequests(requests.filter((r) => r.id !== requestId));
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao processar solicitação.");
      setProcessing(null);
    }
  }

  if (requests.length === 0) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          padding: "3rem 2rem",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 16, color: "#6b7280" }}>
          Nenhuma solicitação pendente no momento.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {error && (
        <div
          style={{
            padding: "1rem",
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            color: "#991b1b",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {requests.map((req) => (
        <div
          key={req.id}
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: "1.5rem",
          }}
        >
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                  {req.User.name || req.User.email}
                </h3>
                <p style={{ fontSize: 13, color: "#6b7280", margin: "0.25rem 0 0 0" }}>
                  {req.User.email} • {req.User.role}
                </p>
              </div>
              <span
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  background: "#fef3c7",
                  color: "#92400e",
                }}
              >
                Pendente
              </span>
            </div>

            <div style={{ marginTop: "0.75rem", fontSize: 14 }}>
              <strong>Campo:</strong> {fieldLabels[req.campo] || req.campo}
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: 14, color: "#6b7280" }}>
              <div>
                <strong>Valor atual:</strong> {req.valorAntigo || "—"}
              </div>
              <div style={{ marginTop: "0.25rem" }}>
                <strong>Valor solicitado:</strong> {req.valorNovo}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: "0.5rem" }}>
              {new Date(req.createdAt).toLocaleString("pt-BR")}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => handleAction(req.id, "approve")}
              disabled={processing === req.id}
              style={{
                padding: "0.5rem 1rem",
                background: processing === req.id ? "#9ca3af" : "#059669",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: processing === req.id ? "not-allowed" : "pointer",
              }}
            >
              {processing === req.id ? "Processando..." : "✓ Aprovar"}
            </button>
            <button
              onClick={() => {
                const motivo = prompt("Motivo da rejeição:");
                if (motivo) {
                  handleAction(req.id, "reject", motivo);
                }
              }}
              disabled={processing === req.id}
              style={{
                padding: "0.5rem 1rem",
                background: processing === req.id ? "#9ca3af" : "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: processing === req.id ? "not-allowed" : "pointer",
              }}
            >
              {processing === req.id ? "Processando..." : "✗ Rejeitar"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

