/**
 * Rota de logout customizada que garante remoção completa de cookies
 * 
 * POST /api/auth/logout
 */

import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/auth";
import { revokeAllUserTokens } from "@/lib/session-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Revoga tokens de sessão
    const { auth } = await import("@/auth");
    const session = await auth();
    if (session?.user) {
      const userId = (session.user as any).id;
      if (userId) {
        revokeAllUserTokens(userId);
      }
    }

    // Faz logout do NextAuth
    await signOut({ redirect: false });

    // Cria resposta que remove todos os cookies explicitamente
    const response = NextResponse.json({ success: true });

    // Remove todos os cookies possíveis do NextAuth
    const cookieNames = [
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
      "next-auth.csrf-token",
      "__Secure-next-auth.csrf-token",
      "next-auth.callback-url",
      "__Secure-next-auth.callback-url",
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

    // Remove cookies adicionais que possam ter sido criados
    response.cookies.set("sessionToken", "", {
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Erro no logout:", error);
    // Mesmo em caso de erro, tenta remover cookies
    const response = NextResponse.json(
      { error: error.message || "Erro ao fazer logout" },
      { status: 500 }
    );

    // Remove cookies mesmo em caso de erro
    response.cookies.set("next-auth.session-token", "", { maxAge: 0, path: "/" });
    response.cookies.set("__Secure-next-auth.session-token", "", { maxAge: 0, path: "/" });

    return response;
  }
}

