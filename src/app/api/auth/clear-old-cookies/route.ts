/**
 * API para limpar cookies de builds antigos
 * 
 * GET /api/auth/clear-old-cookies
 * 
 * Remove todos os cookies de sessão quando detecta build antigo
 */

import { NextRequest, NextResponse } from "next/server";
import { BUILD_VERSION } from "@/lib/build-version";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const response = NextResponse.json({ 
    success: true, 
    message: "Cookies antigos limpos",
    buildVersion: BUILD_VERSION 
  });

  // Remove todos os cookies possíveis do NextAuth
  const cookieNames = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "__Secure-next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
    "sessionToken",
  ];

  cookieNames.forEach((name) => {
    response.cookies.set(name, "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  });

  // Adiciona header para limpar cache
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}

