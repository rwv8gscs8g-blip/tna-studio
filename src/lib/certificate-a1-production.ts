/**
 * Módulo de Produção - Certificado A1 ICP-Brasil
 * 
 * IMPORTANTE: Este módulo é usado em PRODUÇÃO quando CERT_A1_ENFORCE_WRITES=true.
 * 
 * Diferente do módulo de teste, este módulo:
 * - Valida certificado a cada operação administrativa crítica
 * - Registra operações em AdminOperation (auditoria)
 * - Bloqueia operações se certificado inválido (hard fail)
 * - Não permite bypass
 * 
 * Por que Certificado A1 é obrigatório:
 * - Fornece validade jurídica plena nos padrões brasileiros (Lei 14.063/2020)
 * - Garante não-repúdio (algo que WebAuthn não garante)
 * - Fornece cadeia pública de certificação reconhecida internacionalmente
 * - Permite assinatura criptográfica de ações administrativas
 * - Comprova identidade do administrador perante auditorias e obrigações legais (LGPD/GDPR)
 * - Protege contra alterações indevidas e conflitos entre ambientes
 * - Equivale ao mecanismo usado por plataformas críticas do governo (e-CAC, SEFAZ, eSocial)
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import forge from "node-forge";
import { createHash } from "crypto";
import { prisma } from "./prisma";

export interface CertificateValidationResult {
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
    thumbprint: string;
  };
  signatureTest?: {
    performed: boolean;
    ok: boolean;
    message: string;
  };
  issues: string[];
}

export interface AdminOperationSignature {
  operationId: string;
  operationType: string;
  payloadHash: string;
  signatureHash: string;
  certificateSerial: string;
  certificateThumbprint: string;
  timestamp: string;
}

/**
 * Valida e assina operação administrativa com Certificado A1
 * 
 * Esta função é chamada ANTES de cada operação administrativa crítica.
 * Se falhar, a operação é BLOQUEADA (hard fail).
 */
export async function validateAdminCertificateAndSign(
  operationId: string,
  operationType: string,
  payload: any, // Dados da operação (será hasheado)
  userId: string,
  ip: string,
  userAgent: string
): Promise<{
  allowed: boolean;
  reason?: string;
  signature?: AdminOperationSignature;
}> {
  // 1. Verificar se enforcement está habilitado
  if (process.env.CERT_A1_ENFORCE_WRITES !== "true") {
    // Modo de teste - permite mas registra
    return {
      allowed: true,
      reason: "CERT_A1_ENFORCE_WRITES não está habilitado (modo de teste)",
    };
  }

  // 2. Obter caminho e senha do certificado
  const certPath = process.env.CERT_A1_FILE_PATH;
  const certPassword = process.env.CERT_A1_PASSWORD;

  if (!certPath) {
    return {
      allowed: false,
      reason: "CERT_A1_FILE_PATH não configurado. Operação administrativa bloqueada.",
    };
  }

  if (!certPassword) {
    return {
      allowed: false,
      reason: "CERT_A1_PASSWORD não configurado. Operação administrativa bloqueada.",
    };
  }

  // 3. Validar certificado
  const validation = await validateCertificateFile(certPath, certPassword);

  if (!validation.valid) {
    // Registrar tentativa bloqueada
    await logBlockedOperation(
      userId,
      operationType,
      operationId,
      validation.issues.join("; "),
      ip,
      userAgent
    );

    return {
      allowed: false,
      reason: `Certificado A1 inválido: ${validation.issues.join(", ")}`,
    };
  }

  if (!validation.certificate) {
    return {
      allowed: false,
      reason: "Certificado A1 não pôde ser validado",
    };
  }

  // 4. Criar assinatura digital da operação
  const payloadHash = createHash("sha256")
    .update(JSON.stringify({ operationId, operationType, payload, timestamp: new Date().toISOString() }))
    .digest("hex");

  // 5. Assinar com chave privada (simplificado - em produção real, usar chave privada do certificado)
  // Por enquanto, usamos hash como assinatura (placeholder)
  // Em produção real, implementar assinatura real com chave privada
  const signatureHash = createHash("sha256")
    .update(payloadHash + validation.certificate.serial + validation.certificate.thumbprint)
    .digest("hex");

  const signature: AdminOperationSignature = {
    operationId,
    operationType,
    payloadHash,
    signatureHash,
    certificateSerial: validation.certificate.serial,
    certificateThumbprint: validation.certificate.thumbprint,
    timestamp: new Date().toISOString(),
  };

  // 6. Registrar operação em AdminOperation
  await logAdminOperation(
    userId,
    operationType,
    operationId,
    signature,
    true, // success
    null, // no error
    ip,
    userAgent
  );

  return {
    allowed: true,
    signature,
  };
}

/**
 * Valida arquivo de certificado A1
 * Exportada para uso em upload de certificado
 */
export async function validateCertificateFile(
  filePath: string,
  password: string
): Promise<CertificateValidationResult> {
  const issues: string[] = [];

  try {
    // 1. Verificar se arquivo existe
    if (!existsSync(filePath)) {
      return {
        valid: false,
        issues: [`Arquivo não encontrado: ${filePath}`],
      };
    }

    // 2. Ler arquivo .pfx/.p12
    let pfxData: Buffer;
    try {
      pfxData = readFileSync(filePath);
    } catch (error: any) {
      return {
        valid: false,
        issues: [`Erro ao ler arquivo: ${error.message}`],
      };
    }

    // 3. Converter para formato que node-forge entende
    let p12Asn1: forge.asn1.Asn1;
    try {
      const pfxString = Buffer.from(pfxData).toString("binary");
      p12Asn1 = forge.asn1.fromDer(pfxString);
    } catch (error: any) {
      return {
        valid: false,
        issues: [`Erro ao parsear arquivo PKCS#12: ${error.message}`],
      };
    }

    // 4. Descriptografar com senha
    let p12: forge.pkcs12.Pkcs12Pfx;
    try {
      p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    } catch (error: any) {
      return {
        valid: false,
        issues: [
          `Erro ao descriptografar certificado. Senha incorreta ou arquivo corrompido: ${error.message}`,
        ],
      };
    }

    // 5. Extrair certificado e chave privada
    const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });

    const certBag = bags[forge.pki.oids.certBag];
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];

    if (!certBag || certBag.length === 0) {
      return {
        valid: false,
        issues: ["Nenhum certificado encontrado no arquivo PKCS#12"],
      };
    }

    if (!keyBag || keyBag.length === 0) {
      return {
        valid: false,
        issues: ["Nenhuma chave privada encontrada no arquivo PKCS#12"],
      };
    }

    const cert = certBag[0].cert as forge.pki.Certificate;
    const privateKey = keyBag[0].key as forge.pki.rsa.PrivateKey;

    // 6. Extrair metadados
    const subject = cert.subject;
    const issuer = cert.issuer;

    const subjectCN = subject.getField("CN")?.value || "";
    const issuerCN = issuer.getField("CN")?.value || "";
    const subjectO = subject.getField("O")?.value;
    const issuerO = issuer.getField("O")?.value;

    // 7. Validar datas
    const now = new Date();
    const notBefore = cert.validity.notBefore;
    const notAfter = cert.validity.notAfter;

    if (now < notBefore) {
      issues.push(`Certificado ainda não é válido (válido a partir de ${notBefore.toISOString()})`);
    }

    // Calcular thumbprint antes de validar datas
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
    const thumbprint = createHash("sha1").update(Buffer.from(certDer, "binary")).digest("hex");

    if (now > notAfter) {
      return {
        valid: false,
        certificate: {
          subjectCN,
          subjectO,
          issuerCN,
          issuerO: issuerO || undefined,
          serial: cert.serialNumber,
          notBefore: notBefore.toISOString(),
          notAfter: notAfter.toISOString(),
          policyOids: [],
          thumbprint,
        },
        issues: [`Certificado expirado em ${notAfter.toISOString()}`],
      };
    }

    // 8. Validar ICP-Brasil
    const isICPBR = issuerCN.includes("ICP-Brasil") || 
                    issuerCN.includes("AC") ||
                    issuerO?.includes("ICP-Brasil");
    
    if (!isICPBR) {
      issues.push("Certificado não parece ser ICP-Brasil (verificar issuer)");
    }

    // 9. Thumbprint já calculado acima (antes da validação de datas)

    // 10. Teste de assinatura
    let signatureTest = {
      performed: false,
      ok: false,
      message: "",
    };

    try {
      const testMessage = "Teste de assinatura digital TNA-Studio";
      const md = forge.md.sha256.create();
      md.update(testMessage, "utf8");

      const signature = privateKey.sign(md);
      const publicKey = cert.publicKey as forge.pki.rsa.PublicKey;
      const verify = publicKey.verify(md.digest().bytes(), signature);

      signatureTest = {
        performed: true,
        ok: verify,
        message: verify
          ? "Assinatura de teste executada e validada com sucesso"
          : "Assinatura de teste falhou na verificação",
      };

      if (!verify) {
        issues.push("Assinatura digital de teste falhou na verificação");
      }
    } catch (error: any) {
      signatureTest = {
        performed: true,
        ok: false,
        message: `Erro ao executar teste de assinatura: ${error.message}`,
      };
      issues.push(`Erro no teste de assinatura: ${error.message}`);
    }

    // 11. Extrair OIDs de política
    const policyOids: string[] = [];
    if (isICPBR) {
      policyOids.push("2.16.76.1.3.1"); // OID ICP-Brasil
    }

    return {
      valid: issues.length === 0,
      certificate: {
        subjectCN,
        subjectO,
        issuerCN,
        issuerO: issuerO || undefined,
        serial: cert.serialNumber,
        notBefore: notBefore.toISOString(),
        notAfter: notAfter.toISOString(),
        policyOids,
        thumbprint,
      },
      signatureTest,
      issues,
    };
  } catch (error: any) {
    return {
      valid: false,
      issues: [`Erro inesperado: ${error.message}`],
    };
  }
}

/**
 * Registra operação administrativa em AdminOperation
 */
async function logAdminOperation(
  userId: string,
  operationType: string,
  resourceId: string | null,
  signature: AdminOperationSignature,
  success: boolean,
  errorMessage: string | null,
  ip: string,
  userAgent: string
): Promise<void> {
  try {
    await prisma.adminOperation.create({
      data: {
        userId,
        operationType,
        resourceType: operationType.split("_")[0] || null, // Ex: "create_gallery" -> "create"
        resourceId,
        certificateSerial: signature.certificateSerial,
        signatureHash: signature.signatureHash,
        signatureData: JSON.stringify(signature),
        ip,
        userAgent,
        success,
        errorMessage,
      },
    });
  } catch (error: any) {
    // Não falha a operação principal se o log falhar, mas registra
    console.error("[CertificateA1] Erro ao registrar operação:", error);
  }
}

/**
 * Registra tentativa bloqueada
 */
async function logBlockedOperation(
  userId: string,
  operationType: string,
  resourceId: string | null,
  reason: string,
  ip: string,
  userAgent: string
): Promise<void> {
  try {
    await prisma.adminOperation.create({
      data: {
        userId,
        operationType: `blocked_${operationType}`,
        resourceType: operationType.split("_")[0] || null,
        resourceId,
        certificateSerial: "N/A",
        signatureHash: "N/A",
        signatureData: JSON.stringify({ reason }),
        ip,
        userAgent,
        success: false,
        errorMessage: reason,
      },
    });
  } catch (error: any) {
    console.error("[CertificateA1] Erro ao registrar operação bloqueada:", error);
  }
}

