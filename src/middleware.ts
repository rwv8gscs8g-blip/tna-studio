/**
 * Middleware de segurança
 * 
 * Protege todas as rotas autenticadas e impede acesso não autorizado
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

// Nota: Middleware simplificado para manter < 1MB no plano gratuito da Vercel
// BUILD_VERSION removido para reduzir tamanho (não é crítico para segurança)

// Rotas públicas (não requerem autenticação)
const publicRoutes = ["/signin", "/api/auth"];

// Rotas que podem ser acessadas sem autenticação mas redirecionam se autenticado
const redirectIfAuthenticated = ["/signin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas /secure requerem autenticação e validação de token (será feita na rota)
  if (pathname.startsWith("/secure/")) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    return NextResponse.next();
  }

  // Permite rotas públicas
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // Se está tentando acessar /signin e já está autenticado, redireciona para home
    if (pathname === "/signin") {
      const session = await auth();
      if (session?.user) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  // Verifica autenticação para todas as outras rotas
  const session = await auth();

  if (!session?.user) {
    // Se não tem sessão válida, limpa cookies antigos e redireciona
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    signInUrl.searchParams.set("clearCookies", "1");
    
    const response = NextResponse.redirect(signInUrl);
    
    // Limpa todos os cookies de sessão
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
    
    // Headers para prevenir cache
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    
    console.log(`[Middleware] Sessão inválida detectada - cookies limpos e redirecionando para login`);
    
    return response;
  }

  // Adiciona headers de segurança
  const response = NextResponse.next();
  
  // Previne directory listing
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  
  // Cache control para conteúdo autenticado
  if (!pathname.startsWith("/api")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
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

