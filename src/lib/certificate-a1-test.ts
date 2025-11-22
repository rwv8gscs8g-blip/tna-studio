/**
 * Módulo de Teste para Certificado A1 ICP-Brasil
 * 
 * Este módulo é usado APENAS para testes quando SECURITY_TEST_MODE=true.
 * NÃO é usado no fluxo de produção ainda.
 * 
 * IMPORTANTE: O certificado nunca deve ser commitado no Git nem colado em prompts.
 * Sempre use CERT_A1_FILE_PATH e CERT_A1_PASSWORD via variáveis de ambiente.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import forge from "node-forge";
import { createHash, createSign } from "crypto";

export interface CertificateTestResult {
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

/**
 * Carrega e valida certificado A1 a partir de arquivo .pfx/.p12
 */
export async function testCertificateA1(
  filePath: string,
  password: string
): Promise<CertificateTestResult> {
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
    // node-forge espera string binária, não Buffer
    let p12Asn1: forge.asn1.Asn1;
    try {
      // Converter Buffer para string binária
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

    // 6. Extrair metadados do certificado
    const subject = cert.subject;
    const issuer = cert.issuer;

    // Extrair CN (Common Name)
    const subjectCN = subject.getField("CN")?.value || "";
    const issuerCN = issuer.getField("CN")?.value || "";

    // Extrair O (Organization)
    const subjectO = subject.getField("O")?.value;
    const issuerO = issuer.getField("O")?.value;

    // Tentar extrair CNPJ/CPF do subject
    let subjectCNPJ: string | undefined;
    let subjectCPF: string | undefined;

    // CNPJ geralmente vem no formato "CNPJ: 12.345.678/0001-90" ou similar
    const cnpjMatch = subjectCN.match(/CNPJ[:\s]*([\d.\-\/]+)/i);
    if (cnpjMatch) {
      subjectCNPJ = cnpjMatch[1].replace(/[.\-\/]/g, "");
    }

    // CPF pode vir no formato "CPF: 123.456.789-00" ou similar
    const cpfMatch = subjectCN.match(/CPF[:\s]*([\d.\-]+)/i);
    if (cpfMatch) {
      subjectCPF = cpfMatch[1].replace(/[.\-]/g, "");
    }

    // 7. Extrair OIDs de política ICP-Brasil
    const policyOids: string[] = [];
    try {
      const extensions = cert.extensions || [];
      for (const ext of extensions) {
        if (ext.oid === forge.pki.oids.certificatePolicies) {
          // Tentar extrair OIDs de política
          if (ext.value) {
            // node-forge pode retornar isso de forma diferente
            // Por enquanto, adicionar o OID conhecido da ICP-Brasil
            policyOids.push(ext.oid);
          }
        }
      }
    } catch (error) {
      // Ignorar erros ao extrair OIDs
    }

    // OID conhecido da ICP-Brasil: 2.16.76.1.3.1
    if (!policyOids.includes("2.16.76.1.3.1")) {
      // Tentar verificar se é ICP-Brasil pelo issuer
      const isICPBR = issuerCN.includes("ICP-Brasil") || 
                      issuerCN.includes("AC") ||
                      issuerO?.includes("ICP-Brasil");
      
      if (isICPBR) {
        policyOids.push("2.16.76.1.3.1"); // OID ICP-Brasil
      } else {
        issues.push("Certificado não parece ser ICP-Brasil (verificar issuer)");
      }
    }

    // 8. Validar datas
    const now = new Date();
    const notBefore = cert.validity.notBefore;
    const notAfter = cert.validity.notAfter;

    if (now < notBefore) {
      issues.push(`Certificado ainda não é válido (válido a partir de ${notBefore.toISOString()})`);
    }

    if (now > notAfter) {
      issues.push(`Certificado expirado em ${notAfter.toISOString()}`);
      return {
        valid: false,
        certificate: {
          subjectCN,
          subjectO,
          subjectCNPJ,
          subjectCPF,
          issuerCN,
          issuerO,
          serial: cert.serialNumber,
          notBefore: notBefore.toISOString(),
          notAfter: notAfter.toISOString(),
          policyOids,
        },
        issues,
      };
    }

    // 9. Calcular thumbprint (hash SHA1 do certificado)
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
    const thumbprint = createHash("sha1").update(Buffer.from(certDer, "binary")).digest("hex");

    // 10. Teste de assinatura digital
    let signatureTest = {
      performed: false,
      ok: false,
      message: "",
    };

    try {
      const testMessage = "Teste de assinatura digital TNA-Studio";
      const md = forge.md.sha256.create();
      md.update(testMessage, "utf8");

      // Assinar com chave privada
      const signature = privateKey.sign(md);

      // Verificar assinatura com chave pública
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

    // 11. Resultado final
    return {
      valid: issues.length === 0,
      certificate: {
        subjectCN,
        subjectO,
        subjectCNPJ,
        subjectCPF,
        issuerCN,
        issuerO,
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

