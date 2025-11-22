"use client";

/**
 * Página de Teste para Certificado A1 ICP-Brasil
 * 
 * IMPORTANTE: Esta página só funciona quando SECURITY_TEST_MODE=true.
 * NÃO é usada no fluxo de produção ainda.
 * 
 * Esta página permite testar a validação e assinatura digital de certificados A1
 * sem impactar o fluxo de autenticação atual.
 */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";

interface CertificateTestResult {
  valid: boolean;
  certificate?: {
    subjectCN: string;
    subjectO?: string;
    subjectCNPJ?: string;
    subjectCPF?: string;
    issuerCN: string;
    issuerO?: string;
    serial: string;
    notBefore: string;
    notAfter: string;
    policyOids: string[];
    thumbprint?: string;
  };
  signatureTest?: {
    performed: boolean;
    ok: boolean;
    message: string;
  };
  issues: string[];
}

export default function TestCertificateA1Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertificateTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Verificar autenticação e role
  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/signin?callbackUrl=/security/test-a1");
      return;
    }

    const userRole = (session.user as any).role as Role;
    if (userRole !== Role.ADMIN && userRole !== Role.SUPER_ADMIN) {
      router.push("/");
      return;
    }
  }, [session, status, router]);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/security/test-a1");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao testar certificado");
        return;
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Erro ao testar certificado");
    } finally {
      setLoading(false);
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
  if (userRole !== Role.ADMIN && userRole !== Role.SUPER_ADMIN) {
    return null; // Redirecionamento em andamento
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "1rem" }}>
        Teste de Certificado A1 ICP-Brasil
      </h1>

      <div
        style={{
          padding: "1rem",
          background: "#fef3c7",
          border: "1px solid #fbbf24",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
      >
        <p style={{ margin: 0, fontSize: "14px", color: "#92400e" }}>
          <strong>⚠️ Módulo de Teste:</strong> Este é um módulo de teste de certificado A1.
          Ele ainda não é obrigatório para as operações normais do sistema. A obrigatoriedade
          será ativada futuramente via <code>CERT_A1_ENFORCE_WRITES=true</code>.
        </p>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={handleTest}
          disabled={loading}
          style={{
            padding: "0.75rem 1.5rem",
            background: loading ? "#9ca3af" : "#111827",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          {loading ? "Testando..." : "Testar Certificado A1"}
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

      {result && (
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "1rem" }}>
            Resultado do Teste
          </h2>

          {/* Status geral */}
          <div
            style={{
              padding: "1rem",
              background: result.valid ? "#d1fae5" : "#fee2e2",
              border: `1px solid ${result.valid ? "#10b981" : "#ef4444"}`,
              borderRadius: "8px",
              marginBottom: "2rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "20px" }}>
                {result.valid ? "✅" : "❌"}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  color: result.valid ? "#065f46" : "#991b1b",
                }}
              >
                {result.valid ? "Certificado Válido" : "Certificado Inválido"}
              </span>
            </div>
          </div>

          {/* Dados do certificado */}
          {result.certificate && (
            <div
              style={{
                padding: "1.5rem",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                marginBottom: "2rem",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "1rem" }}>
                Dados do Certificado
              </h3>

              <div style={{ display: "grid", gap: "0.75rem" }}>
                <div>
                  <strong>Subject (CN):</strong> {result.certificate.subjectCN}
                </div>
                {result.certificate.subjectO && (
                  <div>
                    <strong>Organização:</strong> {result.certificate.subjectO}
                  </div>
                )}
                {result.certificate.subjectCNPJ && (
                  <div>
                    <strong>CNPJ:</strong> {result.certificate.subjectCNPJ}
                  </div>
                )}
                {result.certificate.subjectCPF && (
                  <div>
                    <strong>CPF:</strong> {result.certificate.subjectCPF}
                  </div>
                )}
                <div>
                  <strong>Issuer (CN):</strong> {result.certificate.issuerCN}
                </div>
                {result.certificate.issuerO && (
                  <div>
                    <strong>Issuer (O):</strong> {result.certificate.issuerO}
                  </div>
                )}
                <div>
                  <strong>Serial Number:</strong> {result.certificate.serial}
                </div>
                {result.certificate.thumbprint && (
                  <div>
                    <strong>Thumbprint (SHA1):</strong>{" "}
                    <code style={{ fontSize: "12px" }}>
                      {result.certificate.thumbprint}
                    </code>
                  </div>
                )}
                <div>
                  <strong>Válido de:</strong>{" "}
                  {new Date(result.certificate.notBefore).toLocaleString("pt-BR")}
                </div>
                <div>
                  <strong>Válido até:</strong>{" "}
                  {new Date(result.certificate.notAfter).toLocaleString("pt-BR")}
                </div>
                {result.certificate.policyOids.length > 0 && (
                  <div>
                    <strong>OIDs de Política:</strong>
                    <ul style={{ margin: "0.5rem 0 0 1.5rem" }}>
                      {result.certificate.policyOids.map((oid, i) => (
                        <li key={i}>
                          <code>{oid}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Teste de assinatura */}
          {result.signatureTest && (
            <div
              style={{
                padding: "1.5rem",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                marginBottom: "2rem",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "1rem" }}>
                Teste de Assinatura Digital
              </h3>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                <span style={{ fontSize: "20px" }}>
                  {result.signatureTest.ok ? "✅" : "❌"}
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    color: result.signatureTest.ok ? "#065f46" : "#991b1b",
                  }}
                >
                  {result.signatureTest.message}
                </span>
              </div>
            </div>
          )}

          {/* Issues */}
          {result.issues.length > 0 && (
            <div
              style={{
                padding: "1.5rem",
                background: "#fee2e2",
                border: "1px solid #ef4444",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "1rem" }}>
                Problemas Encontrados
              </h3>
              <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                {result.issues.map((issue, i) => (
                  <li key={i} style={{ marginBottom: "0.5rem", color: "#991b1b" }}>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* JSON raw (para debug) */}
      {result && (
        <details style={{ marginTop: "2rem" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, marginBottom: "0.5rem" }}>
            JSON Completo (Debug)
          </summary>
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
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

