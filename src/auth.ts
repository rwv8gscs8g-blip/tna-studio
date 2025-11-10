import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { headers } from "next/headers";

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
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" },
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

        // ---- Rate limit simples (usa await headers()) ----
        const hdrs = (await (headers() as unknown as Promise<Readonly<Headers>>)) as Headers;
        const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
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

        const role = (user as any).role ?? "model";
        return { id: user.id, name: user.name ?? "", email: user.email, image: user.image ?? undefined, role } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role ?? "model";
      return token as any;
    },
    async session({ session, token }) {
      if (token) (session.user as any).role = (token as any).role ?? "model";
      return session;
    },
  },
  pages: { signIn: "/signin" },
  trustHost: false,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);