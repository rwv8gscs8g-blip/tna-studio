/**
 * API de Teste Experimental para gov.br Login
 * 
 * IMPORTANTE: Esta rota é EXPERIMENTAL e só funciona quando:
 * - SECURITY_TEST_MODE=true
 * - ENABLE_GOVBR_EXPERIMENTAL=true
 * 
 * Este módulo NÃO substitui:
 * - Certificado A1 (obrigatório para escrita admin)
 * - Login principal atual (Email + Senha)
 * 
 * Serve apenas para avaliar viabilidade técnica e jurídica futura.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Role } from "@prisma/client";

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

  if (process.env.ENABLE_GOVBR_EXPERIMENTAL !== "true") {
    return NextResponse.json(
      { error: "Módulo experimental gov.br não está habilitado" },
      { status: 403 }
    );
  }

  // 2. Verificar autenticação (apenas admin/super_admin)
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userRole = (session.user as any).role as Role;
  if (userRole !== Role.ADMIN && userRole !== Role.SUPER_ADMIN) {
    return NextResponse.json(
      { error: "Acesso negado. Apenas administradores podem testar gov.br." },
      { status: 403 }
    );
  }

  // 3. Verificar se credenciais gov.br estão configuradas
  const clientId = process.env.GOVBR_CLIENT_ID;
  const clientSecret = process.env.GOVBR_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        error: "Credenciais gov.br não configuradas",
        message:
          "Configure GOVBR_CLIENT_ID e GOVBR_CLIENT_SECRET nas variáveis de ambiente",
      },
      { status: 400 }
    );
  }

  // 4. TODO: Implementar fluxo OAuth gov.br
  // Por enquanto, retornar informações sobre o que seria necessário

  return NextResponse.json({
    status: "experimental",
    message:
      "Módulo experimental gov.br. Implementação completa requer integração com OAuth 2.0 do gov.br.",
    required: {
      clientId: clientId ? "✅ Configurado" : "❌ Não configurado",
      clientSecret: clientSecret ? "✅ Configurado" : "❌ Não configurado",
    },
    nextSteps: [
      "Obter credenciais do gov.br (Client ID e Client Secret)",
      "Configurar redirect URI: https://tna-studio.vercel.app/api/auth/callback/govbr",
      "Implementar provider gov.br no NextAuth (se SDK disponível)",
      "Testar fluxo OAuth completo",
      "Validar claims retornados (CPF, nome, nível de segurança)",
    ],
    documentation: {
      govbr: "https://www.gov.br/conecta/catalogo/apis/apis-de-autenticacao",
      notes: "docs/GOVBR-EXPERIMENTAL-NOTES.md",
    },
  });
}

