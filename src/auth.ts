import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";
import { headers } from "next/headers";
import { BUILD_TIMESTAMP, BUILD_VERSION, isTokenFromOldBuild } from "@/lib/build-version";

/* Prisma singleton (safe em dev) */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var rateLimit: Map<string, number[]> | undefined;
}
const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 300 }, // 5 minutos (300 segundos) - explícito
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 300, // 5 minutos - explícito no cookie
        // Domain não especificado para funcionar em todos os subdomínios
        // Safari requer HTTPS para cookies __Secure-*
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.csrf-token"
          : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
    },
  },
  providers: [
    Credentials({
      name: "Login com credenciais",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.toLowerCase().trim()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        // ---- Rate limit simples ----
        let ip = "127.0.0.1";
        try {
          const hdrs = await headers();
          ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? 
               hdrs.get("cf-connecting-ip") ?? 
               "127.0.0.1";
        } catch {
          // headers() pode não estar disponível em alguns ambientes (ex.: scripts)
        }
        globalThis.rateLimit = globalThis.rateLimit || new Map();
        const now = Date.now();
        const attempts = globalThis.rateLimit.get(ip) || [];
        const recent = attempts.filter((t) => now - t < 60_000);
        if (recent.length >= 5) {
          console.warn(`⚠️ Rate limit exceeded for ${ip}`);
          return null;
        }
        globalThis.rateLimit.set(ip, [...recent, now]);

        // ---- Busca usuário e confere senha ----
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(user as any).passwordHash) return null;

        const ok = await compare(password, (user as any).passwordHash as string);
        if (!ok) return null;

        const role = (user as any).role ?? Role.MODEL;
        return { id: user.id, name: user.name ?? "", email: user.email, role } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      const now = Math.floor(Date.now() / 1000);
      
      if (user) {
        // Novo login - cria token
        token.id = user.id;
        token.role = (user as any).role ?? Role.MODEL;
        token.iat = now; // Timestamp de criação
        token.exp = now + 300; // Expira em 5 minutos (300 segundos)
        const userId = user.id || (user as any).id || "unknown";
        console.log(`[Auth] Novo token criado para userId=${userId.substring(0, 8)}... (expira em ${token.exp})`);
      } else if (token) {
        // Token existente - valida expiração e build
        
        // 1. Valida expiração PRIMEIRO (mais crítico)
        if (token.exp && token.exp < now) {
          console.warn(`[Auth] Token REJEITADO - expirado (exp: ${token.exp}, now: ${now}, expirado há ${now - token.exp}s)`);
          return null as any;
        }
        
        // 2. Verifica se token é de build antigo (criado antes do restart)
        if (isTokenFromOldBuild(token.iat)) {
          console.warn(`[Auth] Token REJEITADO - build antigo (iat: ${token.iat}, build atual iniciado em: ${new Date(BUILD_TIMESTAMP).toISOString()})`);
          return null as any;
        }
        
        // 3. Se trigger é "update" e token não está expirado, estende em 5 minutos
        if (trigger === "update" && token.exp && token.exp > now) {
          const newExp = now + 300; // Estende em 5 minutos
          token.exp = newExp;
          token.iat = now; // Atualiza iat também
          console.log(`[Auth] Token estendido para userId=${(token.id as string)?.substring(0, 8)}... (novo exp: ${newExp})`);
        }
      }
      return token as any;
    },
    async session({ session, token }) {
      // Se token é null (expirado ou de build antigo), retorna sessão vazia
      if (!token) {
        console.warn(`[Auth] Sessão inválida - token null ou expirado`);
        return { ...session, user: null } as any;
      }
      
      if (token) {
        (session.user as any).id = (token as any).id;
        (session.user as any).role = (token as any).role ?? Role.MODEL;
        
        // Define expires baseado em token.exp (servidor controla)
        // Converte de segundos (Unix timestamp) para Date ISO string
        if (token.exp) {
          (session as any).expires = new Date(token.exp * 1000).toISOString();
        }
      }
      return session;
    },
  },
  pages: { signIn: "/signin" },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);