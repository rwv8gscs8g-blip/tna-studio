/**
 * Middleware de segurança - Versão Minimalista
 * 
 * IMPORTANTE: Este middleware é minimalista para manter < 1MB (limite do plano gratuito Vercel).
 * Não usa `auth()` do NextAuth (muito pesado - importa Prisma, bcryptjs, etc).
 * Apenas verifica presença de cookie de sessão. Validação completa é feita nas rotas.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas públicas (não requerem autenticação)
const publicRoutes = ["/signin", "/api/auth"];

/**
 * Verifica se existe cookie de sessão NextAuth
 * Não valida o token - apenas verifica presença
 */
function hasSessionCookie(request: NextRequest): boolean {
  const cookieName = process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
  
  return request.cookies.has(cookieName);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas - sempre permitidas
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // Se está em /signin e tem cookie de sessão, redireciona para home
    // (validação completa será feita na rota se necessário)
    if (pathname === "/signin" && hasSessionCookie(request)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Para todas as outras rotas, verifica presença de cookie
  // Validação completa do token será feita nas rotas individuais via `auth()`
  if (!hasSessionCookie(request)) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    signInUrl.searchParams.set("clearCookies", "1");
    
    const response = NextResponse.redirect(signInUrl);
    
    // Limpa cookies de sessão (caso existam)
    const cookieNames = [
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
      "next-auth.csrf-token",
      "__Secure-next-auth.csrf-token",
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
    
    return response;
  }

  // Adiciona headers de segurança
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "no-referrer");
  
  // Cache control para conteúdo autenticado
  if (!pathname.startsWith("/api")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }

  return response;
}

// Configura quais rotas o middleware deve executar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

