"use client";

/**
 * Página de Teste Experimental para gov.br Login
 * 
 * IMPORTANTE: Esta página é EXPERIMENTAL e só funciona quando:
 * - SECURITY_TEST_MODE=true
 * - ENABLE_GOVBR_EXPERIMENTAL=true
 * 
 * Este módulo NÃO substitui:
 * - Certificado A1 (obrigatório para escrita admin)
 * - Login principal atual (Email + Senha)
 * 
 * Serve apenas para avaliar viabilidade técnica e jurídica futura.
 */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";

export default function TestGovBRPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [govbrData, setGovbrData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Verificar autenticação e role
  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/signin?callbackUrl=/security/test-govbr");
      return;
    }

    const userRole = (session.user as any).role as Role;
    if (userRole !== Role.ADMIN && userRole !== Role.SUPERADMIN) {
      router.push("/");
      return;
    }
  }, [session, status, router]);

  const handleTestGovBR = async () => {
    setError(null);
    setGovbrData(null);

    try {
      const response = await fetch("/api/auth/govbr-test");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao testar gov.br");
        return;
      }

      setGovbrData(data);
    } catch (err: any) {
      setError(err.message || "Erro ao testar gov.br");
    }
  };

  if (status === "loading") {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!session?.user) {
    return null; // Redirecionamento em andamento
  }

  const userRole = (session.user as any).role as Role;
  if (userRole !== Role.ADMIN && userRole !== Role.SUPERADMIN) {
    return null; // Redirecionamento em andamento
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "1rem" }}>
        Teste Experimental gov.br Login
      </h1>

      <div
        style={{
          padding: "1rem",
          background: "#dbeafe",
          border: "1px solid #3b82f6",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
      >
        <p style={{ margin: 0, fontSize: "14px", color: "#1e40af" }}>
          <strong>🔬 Módulo Experimental:</strong> Este módulo é experimental e serve apenas
          para avaliar viabilidade técnica e jurídica futura. Ele NÃO substitui o Certificado
          A1 (obrigatório para escrita admin) nem o login principal atual (Email + Senha).
        </p>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={handleTestGovBR}
          style={{
            padding: "0.75rem 1.5rem",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          Testar gov.br Login
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "1rem",
            background: "#fee2e2",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            marginBottom: "2rem",
          }}
        >
          <p style={{ margin: 0, color: "#991b1b", fontWeight: 600 }}>Erro:</p>
          <p style={{ margin: "0.5rem 0 0 0", color: "#991b1b" }}>{error}</p>
        </div>
      )}

      {govbrData && (
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "1rem" }}>
            Dados Retornados do gov.br
          </h2>

          <div
            style={{
              padding: "1.5rem",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          >
            <pre
              style={{
                padding: "1rem",
                background: "#1f2937",
                color: "#f9fafb",
                borderRadius: "8px",
                overflow: "auto",
                fontSize: "12px",
              }}
            >
              {JSON.stringify(govbrData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div
        style={{
          padding: "1rem",
          background: "#f3f4f6",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          marginTop: "2rem",
        }}
      >
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "0.5rem" }}>
          Status da Implementação
        </h3>
        <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
          Esta funcionalidade requer credenciais do gov.br (Client ID e Client Secret).
          Consulte a documentação em <code>docs/GOVBR-EXPERIMENTAL-NOTES.md</code> para
          instruções de configuração.
        </p>
      </div>
    </div>
  );
}

