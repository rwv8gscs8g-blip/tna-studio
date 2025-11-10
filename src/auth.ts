import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { headers } from "next/headers";

const prisma = new PrismaClient();

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
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        // ---- Rate Limit em memória (simples e leve para DEV) ----
        const ip =
          headers().get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
        globalThis.rateLimit = globalThis.rateLimit || new Map();
        const now = Date.now();
        const attempts = globalThis.rateLimit.get(ip) || [];
        const recent = attempts.filter((t: number) => now - t < 60_000);
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
          role: (user as any).role ?? "model",
        } as any;
      },
    }),
  ],

  /* ----------------------------- CALLBACKS JWT ---------------------------- */
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? "model";
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).role = (token as any).role ?? "model";
      }
      return session;
    },
  },

  /* -------------------------- PÁGINAS PERSONALIZADAS -------------------------- */
  pages: {
    signIn: "/signin", // sua tela de login
  },

  /* -------------------------- SEGURANÇA ADICIONAL -------------------------- */
  trustHost: false, // impede conexões inseguras
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);