/**
 * API para logar erros do cliente no servidor
 * 
 * POST /api/log-error
 * Body: { type: string, photoId?: string, error: string, status?: number }
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, photoId, error, status } = body;

    // Log estruturado no servidor
    console.error(`[ClientError] type=${type}, photoId=${photoId || "N/A"}, error="${error}", status=${status || "N/A"}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Ignora erros de log para não quebrar o fluxo principal
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

