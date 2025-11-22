/**
 * Rota de logout customizada que garante remoção completa de cookies
 * 
 * POST /api/auth/logout
 */

import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/auth";
import { revokeAllUserTokens } from "@/lib/session-tokens";
import { removeArquitetoSession } from "@/lib/arquiteto-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Revoga tokens de sessão
    const { auth } = await import("@/auth");
    const session = await auth();
    if (session?.user) {
      const userId = (session.user as any).id;
      const userRole = (session.user as any).role;
      if (userId) {
        revokeAllUserTokens(userId);
        // Remove sessão de arquiteto se for ARQUITETO
        if (userRole === "ARQUITETO") {
          await removeArquitetoSession(userId);
        }
      }
    }

    // Faz logout do NextAuth
    await signOut({ redirect: false });

    // Cria resposta que remove todos os cookies explicitamente
    const response = NextResponse.json({ success: true });

    // Remove todos os cookies possíveis do NextAuth
    // Lista completa de cookies possíveis (incluindo variações)
    const cookieNames = [
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
      "next-auth.csrf-token",
      "__Secure-next-auth.csrf-token",
      "next-auth.callback-url",
      "__Secure-next-auth.callback-url",
      "sessionToken",
      "authjs.session-token",
      "__Secure-authjs.session-token",
      "authjs.csrf-token",
      "__Secure-authjs.csrf-token",
    ];

    const isProduction = process.env.NODE_ENV === "production";
    const host = req.headers.get("host") || "";
    const domain = host.split(":")[0];

    // Remove cookies com TODAS as combinações possíveis
    cookieNames.forEach((name) => {
      const paths = ["/", ""];
      const domains = domain ? [domain, `.${domain}`, ""] : [""];
      const sameSiteOptions = ["lax", "strict", "none"] as const;
      
      paths.forEach((path) => {
        domains.forEach((cookieDomain) => {
          sameSiteOptions.forEach((sameSite) => {
            // Remove com httpOnly: false
            response.cookies.set(name, "", {
              maxAge: 0,
              path,
              domain: cookieDomain || undefined,
              httpOnly: false,
              sameSite,
              secure: isProduction || sameSite === "none",
            });
            
            // Remove com httpOnly: true
            response.cookies.set(name, "", {
              maxAge: 0,
              path,
              domain: cookieDomain || undefined,
              httpOnly: true,
              sameSite,
              secure: isProduction || sameSite === "none",
            });
          });
        });
      });
    });

    // Redireciona para home com parâmetro de logout
    response.headers.set("Location", "/?logout=success");
    
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

