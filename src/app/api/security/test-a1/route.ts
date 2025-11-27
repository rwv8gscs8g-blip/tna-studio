/**
 * API de Teste para Certificado A1 ICP-Brasil
 * 
 * IMPORTANTE: Esta rota só funciona quando SECURITY_TEST_MODE=true.
 * NÃO é usada no fluxo de produção ainda.
 * 
 * Esta rota permite testar a validação e assinatura digital de certificados A1
 * sem impactar o fluxo de autenticação atual.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { testCertificateA1 } from "@/lib/certificate-a1-test";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 1. Verificar se modo de teste está habilitado
  if (process.env.SECURITY_TEST_MODE !== "true") {
    return NextResponse.json(
      { error: "Modo de teste de segurança não está habilitado" },
      { status: 403 }
    );
  }

  // 2. Verificar autenticação (apenas admin/super_admin)
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userRole = (session.user as any).role as Role;
  if (userRole !== Role.ADMIN && userRole !== Role.SUPERADMIN) {
    return NextResponse.json(
      { error: "Acesso negado. Apenas administradores podem testar certificados." },
      { status: 403 }
    );
  }

  // 3. Obter caminho e senha do certificado das variáveis de ambiente
  const certPath = process.env.CERT_A1_FILE_PATH;
  const certPassword = process.env.CERT_A1_PASSWORD;

  if (!certPath) {
    return NextResponse.json(
      {
        valid: false,
        issues: ["CERT_A1_FILE_PATH não definido nas variáveis de ambiente"],
      },
      { status: 400 }
    );
  }

  if (!certPassword) {
    return NextResponse.json(
      {
        valid: false,
        issues: ["CERT_A1_PASSWORD não definido nas variáveis de ambiente"],
      },
      { status: 400 }
    );
  }

  // 4. Testar certificado
  try {
    const result = await testCertificateA1(certPath, certPassword);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        valid: false,
        issues: [`Erro ao testar certificado: ${error.message}`],
      },
      { status: 500 }
    );
  }
}

