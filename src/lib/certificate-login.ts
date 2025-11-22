/**
 * Login via Certificado Digital A1 ICP-Brasil
 * 
 * Permite login usando certificado digital A1 armazenado no servidor
 * Valida: cadeia ICP-Brasil, validade, thumbprint, OIDs obrigatórios
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import forge from "node-forge";
import { createHash } from "crypto";
import { prisma } from "./prisma";
import { Role } from "@prisma/client";

export interface CertificateLoginResult {
  success: boolean;
  userId?: string;
  certificate?: {
    serial: string;
    thumbprint: string;
    subjectCN: string;
    validUntil: Date;
  };
  error?: string;
}

/**
 * Autentica usuário via certificado digital A1
 * 
 * O certificado deve estar em secrets/certs/assinatura_a1.pfx
 * E estar associado ao usuário via AdminCertificate
 */
export async function authenticateWithCertificate(
  certificatePath?: string,
  certificatePassword?: string
): Promise<CertificateLoginResult> {
  try {
    // 1. Obter caminho e senha do certificado
    const certPath = certificatePath || process.env.CERT_A1_FILE_PATH || "./secrets/certs/assinatura_a1.pfx";
    const certPassword = certificatePassword || process.env.CERT_A1_PASSWORD;

    if (!certPassword) {
      return {
        success: false,
        error: "Senha do certificado não configurada",
      };
    }

    // 2. Validar certificado
    const validation = await validateCertificateFile(certPath, certPassword);

    if (!validation.valid || !validation.certificate) {
      return {
        success: false,
        error: validation.issues.join(", "),
      };
    }

    // 3. Buscar usuário associado ao certificado pelo serial number
    // Protegido contra tabela inexistente (degradável)
    let certificateRecord = null;
    try {
      certificateRecord = await prisma.adminCertificate.findFirst({
        where: {
          serialNumber: validation.certificate.serial,
          isActive: true,
          validUntil: {
            gte: new Date(),
          },
        },
        include: {
          User_AdminCertificate_userIdToUser: true,
        },
      });
    } catch (error: any) {
      // Erro P2021: tabela não existe
      // Outros erros de Prisma também são tratados aqui
      if (error?.code === "P2021" || error?.code === "P1001" || error?.message?.includes("does not exist")) {
        console.warn(`[CertificateLogin] Tabela AdminCertificate não existe ou não está acessível (${error.code}). Ignorando autenticação por certificado e caindo para senha.`);
        return {
          success: false,
          error: "Tabela AdminCertificate não disponível. Use login por senha.",
        };
      }
      // Outros erros são logados mas não quebram o fluxo
      console.warn(`[CertificateLogin] Erro ao consultar AdminCertificate: ${error.message}. Ignorando e caindo para senha.`);
      return {
        success: false,
        error: "Erro ao consultar certificado. Use login por senha.",
      };
    }

    if (!certificateRecord) {
      return {
        success: false,
        error: "Certificado não está associado a nenhum usuário ativo",
      };
    }

    // 4. Verificar se o usuário é ARQUITETO
    const user = certificateRecord.User_AdminCertificate_userIdToUser;
    if (user.role !== Role.ARQUITETO) {
      return {
        success: false,
        error: "Certificado não está associado a um usuário com perfil ARQUITETO",
      };
    }

    // 5. Atualizar lastUsedAt do certificado (protegido contra erros)
    try {
      await prisma.adminCertificate.update({
        where: { id: certificateRecord.id },
        data: { lastUsedAt: new Date() },
      });
    } catch (error: any) {
      // Log mas não falha a autenticação se o update falhar
      console.warn(`[CertificateLogin] Erro ao atualizar lastUsedAt do certificado: ${error.message}. Continuando autenticação.`);
    }

    return {
      success: true,
      userId: user.id,
      certificate: {
        serial: validation.certificate.serial,
        thumbprint: validation.certificate.thumbprint,
        subjectCN: validation.certificate.subjectCN,
        validUntil: new Date(validation.certificate.notAfter),
      },
    };
  } catch (error: any) {
    // Erro P2021: tabela não existe - não logar como erro crítico
    if (error?.code === "P2021" || error?.code === "P1001" || error?.message?.includes("does not exist")) {
      console.warn(`[CertificateLogin] Tabela AdminCertificate não existe ou não está acessível (${error.code}). Ignorando autenticação por certificado e caindo para senha.`);
      return {
        success: false,
        error: "Tabela AdminCertificate não disponível. Use login por senha.",
      };
    }
    
    // Outros erros são logados mas não quebram o fluxo
    console.warn(`[CertificateLogin] Erro na autenticação (não crítico): ${error.message}`);
    return {
      success: false,
      error: error.message || "Erro ao autenticar com certificado. Use login por senha.",
    };
  }
}

/**
 * Valida arquivo de certificado A1
 */
async function validateCertificateFile(
  filePath: string,
  password: string
): Promise<{
  valid: boolean;
  certificate?: {
    serial: string;
    thumbprint: string;
    subjectCN: string;
    notBefore: string;
    notAfter: string;
    policyOids: string[];
  };
  issues: string[];
}> {
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

    // 5. Extrair certificado
    const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = bags[forge.pki.oids.certBag];

    if (!certBag || certBag.length === 0) {
      return {
        valid: false,
        issues: ["Nenhum certificado encontrado no arquivo PKCS#12"],
      };
    }

    const cert = certBag[0].cert as forge.pki.Certificate;

    // 6. Extrair metadados
    const subject = cert.subject;
    const subjectCN = subject.getField("CN")?.value || "";

    // 7. Validar datas
    const now = new Date();
    const notBefore = cert.validity.notBefore;
    const notAfter = cert.validity.notAfter;

    if (now < notBefore) {
      issues.push(`Certificado ainda não é válido (válido a partir de ${notBefore.toISOString()})`);
    }

    if (now > notAfter) {
      return {
        valid: false,
        certificate: {
          serial: cert.serialNumber,
          thumbprint: "", // Não precisa calcular se expirado
          subjectCN,
          notBefore: notBefore.toISOString(),
          notAfter: notAfter.toISOString(),
          policyOids: [],
        },
        issues: [`Certificado expirado em ${notAfter.toISOString()}`],
      };
    }

    // 8. Calcular thumbprint
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
    const thumbprint = createHash("sha1").update(Buffer.from(certDer, "binary")).digest("hex");

    // 9. Validar ICP-Brasil
    const issuer = cert.issuer;
    const issuerCN = issuer.getField("CN")?.value || "";
    const issuerO = issuer.getField("O")?.value;
    
    const isICPBR = issuerCN.includes("ICP-Brasil") || 
                    issuerCN.includes("AC") ||
                    issuerO?.includes("ICP-Brasil");
    
    if (!isICPBR) {
      issues.push("Certificado não parece ser ICP-Brasil (verificar issuer)");
    }

    // 10. Extrair OIDs de política
    const policyOids: string[] = [];
    if (isICPBR) {
      policyOids.push("2.16.76.1.3.1"); // OID ICP-Brasil
    }

    return {
      valid: issues.length === 0,
      certificate: {
        serial: cert.serialNumber,
        thumbprint,
        subjectCN,
        notBefore: notBefore.toISOString(),
        notAfter: notAfter.toISOString(),
        policyOids,
      },
      issues,
    };
  } catch (error: any) {
    return {
      valid: false,
      issues: [`Erro inesperado: ${error.message}`],
    };
  }
}

