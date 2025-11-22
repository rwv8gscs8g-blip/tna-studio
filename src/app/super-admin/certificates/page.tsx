"use client";

/**
 * Página de Gerenciamento de Certificados A1 para SUPER_ADMIN
 * 
 * Permite:
 * - Ver certificados ativos
 * - Testar certificado atual
 * - Adicionar novo certificado
 * - Remover certificado
 */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import Link from "next/link";

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

export default function SuperAdminCertificatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<CertificateTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Verificar autenticação e role
  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/signin?callbackUrl=/super-admin/certificates");
      return;
    }

    const userRole = (session.user as any).role as Role;
    if (userRole !== Role.SUPER_ADMIN) {
      router.push("/");
      return;
    }
  }, [session, status, router]);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch("/api/security/test-a1");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao testar certificado");
        return;
      }

      setTestResult(data);
    } catch (err: any) {
      setError(err.message || "Erro ao testar certificado");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("certificate", file);
      formData.append("password", prompt("Digite a senha do certificado:") || "");

      const response = await fetch("/api/super-admin/certificates/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao fazer upload do certificado");
        return;
      }

      alert("Certificado A1 adicionado com sucesso!");
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Erro ao fazer upload do certificado");
    } finally {
      setUploading(false);
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
  if (userRole !== Role.SUPER_ADMIN) {
    return null; // Redirecionamento em andamento
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: "0.5rem" }}>
          Gerenciamento de Certificados A1 ICP-Brasil
        </h1>
        <p style={{ color: "#6b7280", fontSize: 16 }}>
          Gerencie os certificados digitais A1 usados para assinatura de operações administrativas.
        </p>
      </div>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        {/* Card: Testar Certificado Atual */}
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem" }}>
            Testar Certificado Atual
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "1rem", fontSize: 14 }}>
            Testa o certificado A1 configurado em <code>.env.local</code> (CERT_A1_FILE_PATH).
            Verifica validade, cadeia ICP-Brasil e executa assinatura de teste.
          </p>
          <div style={{ 
            padding: "1rem", 
            background: "#fef3c7", 
            border: "1px solid #fbbf24", 
            borderRadius: 8, 
            marginBottom: "1rem",
            fontSize: 13,
            color: "#92400e"
          }}>
            <strong>⚠️ Importante:</strong> A senha do certificado deve estar configurada em <code>CERT_A1_PASSWORD</code> no arquivo <code>.env.local</code>. 
            Sem a senha correta, o certificado não poderá ser validado.
          </div>
          <button
            onClick={handleTest}
            disabled={loading}
            style={{
              background: loading ? "#9ca3af" : "#111827",
              color: "#fff",
              padding: "0.75rem 1.5rem",
              borderRadius: 8,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {loading ? "Testando..." : "Testar Certificado A1"}
          </button>

          {error && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                color: "#991b1b",
              }}
            >
              <strong>Erro:</strong> {error}
            </div>
          )}

          {testResult && (
            <div style={{ marginTop: "1rem" }}>
              <div
                style={{
                  padding: "1rem",
                  background: testResult.valid ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${testResult.valid ? "#bbf7d0" : "#fecaca"}`,
                  borderRadius: 8,
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: testResult.valid ? "#10b981" : "#ef4444",
                    }}
                  />
                  <strong>
                    {testResult.valid ? "Certificado Válido" : "Certificado Inválido"}
                  </strong>
                </div>
                {testResult.certificate && (
                  <div style={{ fontSize: 13, color: "#374151", marginTop: "0.75rem" }}>
                    <div><strong>Subject:</strong> {testResult.certificate.subjectCN}</div>
                    {testResult.certificate.subjectCPF && (
                      <div><strong>CPF:</strong> {testResult.certificate.subjectCPF}</div>
                    )}
                    <div><strong>Issuer:</strong> {testResult.certificate.issuerCN}</div>
                    <div><strong>Serial:</strong> {testResult.certificate.serial}</div>
                    <div><strong>Válido de:</strong> {new Date(testResult.certificate.notBefore).toLocaleString("pt-BR")}</div>
                    <div><strong>Válido até:</strong> {new Date(testResult.certificate.notAfter).toLocaleString("pt-BR")}</div>
                  </div>
                )}
                {testResult.signatureTest && (
                  <div style={{ marginTop: "0.75rem", fontSize: 13 }}>
                    <div style={{ color: testResult.signatureTest.ok ? "#059669" : "#dc2626" }}>
                      <strong>Teste de Assinatura:</strong> {testResult.signatureTest.message}
                    </div>
                  </div>
                )}
                {testResult.issues.length > 0 && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <strong style={{ color: "#dc2626" }}>Problemas encontrados:</strong>
                    <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
                      {testResult.issues.map((issue, i) => (
                        <li key={i} style={{ color: "#991b1b", fontSize: 13 }}>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Card: Adicionar Novo Certificado */}
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem" }}>
            Adicionar Novo Certificado A1
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "1rem", fontSize: 14 }}>
            Faça upload de um novo arquivo <code>.pfx</code> ou <code>.p12</code> para substituir o certificado atual.
            O certificado será validado e registrado no sistema.
          </p>
          <div style={{ 
            padding: "1rem", 
            background: "#fef3c7", 
            border: "1px solid #fbbf24", 
            borderRadius: 8, 
            marginBottom: "1rem",
            fontSize: 13,
            color: "#92400e"
          }}>
            <strong>⚠️ Importante:</strong> Após fazer upload do certificado, você precisará atualizar o arquivo <code>.env.local</code> com:
            <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
              <li><code>CERT_A1_FILE_PATH=./secrets/certs/assinatura_a1.pfx</code></li>
              <li><code>CERT_A1_PASSWORD="sua_senha_aqui"</code></li>
            </ul>
            Sem essas configurações, o certificado não será usado nas operações administrativas.
          </div>
          <div>
            <input
              type="file"
              accept=".pfx,.p12"
              onChange={handleUpload}
              disabled={uploading}
              style={{
                marginBottom: "1rem",
                padding: "0.5rem",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
            {uploading && <p style={{ color: "#6b7280" }}>Fazendo upload e validando certificado...</p>}
          </div>
        </div>

        {/* Card: Informações */}
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: "1rem" }}>
            Informações Importantes
          </h2>
          <ul style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.8, paddingLeft: "1.5rem" }}>
            <li>O certificado A1 é obrigatório para todas as operações administrativas de escrita.</li>
            <li>O certificado deve ser válido e emitido por uma AC da ICP-Brasil.</li>
            <li>O arquivo do certificado deve estar em formato PKCS#12 (.pfx ou .p12).</li>
            <li>Após adicionar um novo certificado, ele será usado imediatamente para validações.</li>
            <li>O certificado atual está configurado em <code>CERT_A1_FILE_PATH</code> no <code>.env.local</code>.</li>
          </ul>
        </div>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <Link
          href="/"
          style={{
            display: "inline-block",
            color: "#6b7280",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          ← Voltar para Home
        </Link>
      </div>
    </div>
  );
}

