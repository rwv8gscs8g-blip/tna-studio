/**
 * Webhook do D4Sign (Em breve)
 * 
 * Esta rota está reservada para receber callbacks do D4Sign quando um contrato
 * for assinado. Por enquanto, apenas retorna 501 (Not Implemented).
 * 
 * FUTURO: Implementar lógica para:
 * - Validar assinatura do webhook (HMAC)
 * - Atualizar status do ensaio quando contrato for assinado
 * - Notificar ARQUITETO e MODELO sobre assinatura
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { message: "Webhook D4Sign em desenvolvimento. Esta funcionalidade estará disponível em breve." },
    { status: 501 }
  );
}

