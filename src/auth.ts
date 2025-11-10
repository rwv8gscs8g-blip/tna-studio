import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { headers } from "next/headers";

// --- singleton simples do Prisma (evita múltiplas conexões em dev) ---
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// --- tipagem do rate limit no escopo global (evita erro TS) ---
declare global {
  // eslint-disable-next-line no-var
  var rateLimit: Map<string, number[]> | undefined;
}

/* ------------------------- CONFIGURAÇÃO PRINCIPAL ------------------------- */
export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),

  // Estratégia de sessão via JWT (mais segura e performática)
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8h

  // Secret seguro para geração de tokens
  secret: process.env.NEXTAUTH_SECRET,

  // Cookie seguro e com política restrita
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
      },
    },
  },

  /* ---------------------- PROVEDOR DE LOGIN VIA SENHA --------------------- */
  providers: [
    Credentials({
      name: "Login com credenciais",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      // NOTE: authorize é async; headers() agora também precisa de await no Next 15
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        // ---- Rate Limit em memória (simples e leve para DEV) ----
        const h = await headers(); // <- CORRIGIDO: headers() é assíncrono
        const ip =
          h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          h.get("cf-connecting-ip") ||
          "127.0.0.1";

        globalThis.rateLimit = globalThis.rateLimit || new Map();
        const now = Date.now();
        const attempts = globalThis.rateLimit.get(ip) || [];
        const recent = attempts.filter((t) => now - t < 60_000);
        if (recent.length >= 5) {
          console.warn(`⚠️ Rate limit exceeded for ${ip}`);
          return null;
        }
        globalThis.rateLimit.set(ip, [...recent, now]);

        // ---- Busca o usuário ----
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user || !user.passwordHash) return null;

        // ---- Confere a senha ----
        const ok = await compare(credentials.password, user.passwordHash);
        if (!ok) return null;

        // ---- Retorna o objeto mínimo de user ----
        return {
          id: user.id,
          name: user.name ?? "",
          email: user.email,
          image: user.image ?? undefined,
          role: (user as unknown as { role?: string }).role ?? "model",
        } as any;
      },
    }),
  ],

  /* ----------------------------- CALLBACKS JWT ---------------------------- */
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role ?? "model";
      return token;
    },
    async session({ session, token }) {
      if (token) (session.user as any).role = (token as any).role ?? "model";
      return session;
    },
  },

  /* -------------------------- PÁGINAS PERSONALIZADAS ---------------------- */
  pages: {
    signIn: "/signin",
  },

  /* -------------------------- SEGURANÇA ADICIONAL ------------------------- */
  trustHost: false, // mantenha false enquanto estamos só em HTTPS/Pages
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);