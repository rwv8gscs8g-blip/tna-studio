import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
// PrismaAdapter não é necessário com JWT strategy
// import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { Role } from "@prisma/client";
import { headers } from "next/headers";
import { BUILD_TIMESTAMP, BUILD_VERSION, isTokenFromOldBuild } from "@/lib/build-version";
import { prisma } from "@/lib/prisma";
import { registerArquitetoSession, isArquitetoSessionReadOnly } from "@/lib/arquiteto-session";
import { randomUUID } from "crypto";
// Login por certificado A1 temporariamente desativado
// import { authenticateWithCertificate } from "@/lib/certificate-login";

/* Rate limit global */
declare global {
  // eslint-disable-next-line no-var
  var rateLimit: Map<string, number[]> | undefined;
}

// Validar NEXTAUTH_SECRET
const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (!nextAuthSecret) {
  console.error("❌ NEXTAUTH_SECRET não está definido no .env.local");
  throw new Error("NEXTAUTH_SECRET não está definido no .env.local");
}

export const authOptions: NextAuthConfig = {
  // Adapter não é necessário com JWT strategy
  // adapter: PrismaAdapter(prisma),
  session: { 
    strategy: "jwt", 
    maxAge: 3600, // 1 hora (3600 segundos) - padrão máximo, ajustado por role no callback jwt
    updateAge: 3600, // Não renova a sessão a cada requisição (mantém expiração fixa)
    // Nota: Tempo real é controlado por role no callback jwt (1h ARQUITETO, 10min ADMIN/SUPERADMIN, 5min outros)
  },
  secret: nextAuthSecret,
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax", // Protege contra CSRF, mas permite navegação normal
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 3600, // 1 hora - padrão máximo (tempo real controlado por role no callback jwt)
        // Domain não especificado para funcionar em todos os subdomínios
        // Safari requer HTTPS para cookies __Secure-*
        // Nota: Copiar/colar URL em nova aba não deve compartilhar sessão (cookies httpOnly)
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
    // Provider para login por email/senha (ÚNICO MÉTODO ATIVO)
    // Login por certificado A1 temporariamente desativado - preservado em src/lib/certificate-login.ts
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const isDev = process.env.NODE_ENV === "development";
        
        if (isDev) {
          console.log("[auth-debug] Authorize called");
        }
        
        try {
          if (!credentials?.email || !credentials?.password) {
            if (isDev) console.log("[auth-debug] missing email or password");
            return null;
          }

          const email = String(credentials.email).toLowerCase().trim();
          const password = String(credentials.password);

          if (isDev) console.log("[auth-debug] normalized email:", email);

          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              passwordHash: true,
            },
          });

          if (isDev) console.log("[auth-debug] user found:", !!user);

          if (!user || !user.passwordHash) {
            if (isDev) console.log("[auth-debug] user not found or no passwordHash");
            return null;
          }

          const isValid = await compare(password, user.passwordHash);
          if (isDev) console.log("[auth-debug] password valid?", isValid);

          if (!isValid) {
            if (isDev) console.log("[auth-debug] invalid password");
            return null;
          }

          const role = (user.role as string) ?? "MODELO";
          if (isDev) console.log("[auth-debug] role:", role);

          const validRoles = ["ARQUITETO", "ADMIN", "MODELO", "CLIENTE", "SUPERADMIN"];
          if (!validRoles.includes(role)) {
            if (isDev) console.log("[auth-debug] invalid role, got:", role);
            return null;
          }

          if (isDev) console.log("[auth-debug] login success for", email, "with role", role);

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? "",
            role: user.role,
          };
        } catch (err) {
          console.error("[auth-debug] error in authorize:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      const now = Math.floor(Date.now() / 1000);
      
      if (user) {
        // Novo login - cria token
        const userRole = (user as any).role ?? "MODELO";
        // Tempos de sessão por role:
        // ARQUITETO: 60 minutos (3600s)
        // ADMIN: 30 minutos (1800s)
        // MODELO/CLIENTE: 10 minutos (600s)
        // Em desenvolvimento, ARQUITETO não expira (para facilitar trabalho)
        const isDev = process.env.NODE_ENV === "development";
        let sessionMaxAge = 600; // 10 minutos padrão (MODELO/CLIENTE)
        if (userRole === "ARQUITETO") {
          sessionMaxAge = isDev ? 86400 : 3600; // 24h em dev, 1h em produção
        } else if (userRole === "ADMIN" || userRole === "SUPERADMIN") {
          sessionMaxAge = 1800; // 30 minutos
        } else if (userRole === "MODELO" || userRole === "CLIENTE") {
          sessionMaxAge = 600; // 10 minutos
        }
        
        token.id = user.id;
        token.role = userRole;
        token.cpf = (user as any).cpf ?? null;
        token.passport = (user as any).passport ?? null;
        token.iat = now; // Timestamp de criação
        token.exp = now + sessionMaxAge; // Expira baseado no role
        
        // Se é ARQUITETO, gera sessionId único e registra sessão
        if (userRole === "ARQUITETO" && user.id) {
          const sessionId = randomUUID();
          token.arquitetoSessionId = sessionId;
          
          // Registra sessão do ARQUITETO (marca outras como inativas)
          try {
            const headerList = await headers();
            const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                       headerList.get("x-real-ip") ||
                       "unknown";
            const userAgent = headerList.get("user-agent") || "unknown";
            const expiresAt = new Date((now + sessionMaxAge) * 1000);
            
            await registerArquitetoSession(
              user.id,
              sessionId,
              ip,
              userAgent,
              expiresAt
            );
            console.log(`[Auth] Sessão ARQUITETO registrada: sessionId=${sessionId.substring(0, 8)}...`);
          } catch (error: any) {
            // Erro ao registrar sessão não deve quebrar o login
            console.warn(`[Auth] Erro ao registrar sessão ARQUITETO (não crítico):`, error.message);
          }
        }
        
        const userId = user.id || (user as any).id || "unknown";
        console.log(`[Auth] Novo token criado para userId=${userId.substring(0, 8)}... role=${userRole} (expira em ${token.exp}, ${sessionMaxAge}s)`);
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
        
        // 3. IMPORTANTE: NÃO renova token em refresh de página
        // Apenas renova se trigger === "update" (chamado explicitamente pelo SessionTimer)
        // Refresh normal (sem trigger) mantém expiração original
        if (!trigger || trigger !== "update") {
          // Refresh normal - mantém expiração original, não renova
          const timeLeft = token.exp ? token.exp - now : 0;
          console.log(`[Auth] Token mantido (refresh normal, não renovado) para userId=${(token.id as string)?.substring(0, 8)}... (exp: ${token.exp}, restam ${timeLeft}s)`);
          return token as any; // Retorna token sem modificar exp
        }
        
        // 4. Se trigger é "update" (chamado pelo SessionTimer), pode estender
        // Mas apenas se faltarem menos de 2 minutos (120s)
        if (trigger === "update" && token.exp && token.exp > now) {
          const timeLeft = token.exp - now;
          if (timeLeft <= 120) {
            // Estende apenas se faltarem menos de 2 minutos
            const userRole = (token as any).role ?? "MODELO";
            const isDev = process.env.NODE_ENV === "development";
            let sessionMaxAge = 600; // 10 minutos padrão (MODELO/CLIENTE)
            if (userRole === "ARQUITETO") {
              sessionMaxAge = isDev ? 86400 : 3600; // 24h em dev, 1h em produção
            } else if (userRole === "ADMIN" || userRole === "SUPERADMIN") {
              sessionMaxAge = 1800; // 30 minutos
            } else if (userRole === "MODELO" || userRole === "CLIENTE") {
              sessionMaxAge = 600; // 10 minutos
            }
            token.exp = now + sessionMaxAge;
            console.log(`[Auth] Token estendido (trigger=update, faltavam ${timeLeft}s) para userId=${(token.id as string)?.substring(0, 8)}... (novo exp: ${token.exp})`);
          } else {
            // Mantém expiração original se ainda tem mais de 2 minutos
            console.log(`[Auth] Token mantido (ainda tem ${timeLeft}s) para userId=${(token.id as string)?.substring(0, 8)}...`);
          }
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
        const userRole = (token as any).role ?? "MODELO";
        (session.user as any).id = (token as any).id;
        (session.user as any).role = userRole;
        (session.user as any).cpf = (token as any).cpf ?? null;
        (session.user as any).passport = (token as any).passport ?? null;
        
        // Define expires baseado em token.exp (servidor controla)
        // Converte de segundos (Unix timestamp) para Date ISO string
        if (token.exp) {
          (session as any).expires = new Date(token.exp * 1000).toISOString();
        }
        
        // Se é ARQUITETO, passa sessionId e verifica se está em modo somente leitura
        if (userRole === "ARQUITETO") {
          const sessionId = (token as any).arquitetoSessionId;
          const userId = (token as any).id;
          
          // Passa sessionId para a sessão (pode ser usado no frontend se necessário)
          if (sessionId) {
            (session as any).arquitetoSessionId = sessionId;
          }
          
          // Verifica se está em modo somente leitura
          if (sessionId && userId) {
            try {
              const isReadOnly = await isArquitetoSessionReadOnly(userId, sessionId);
              (session as any).isReadOnlyArquiteto = isReadOnly;
              
              if (isReadOnly) {
                console.log(`[Auth] Sessão ARQUITETO em modo somente leitura: sessionId=${sessionId.substring(0, 8)}...`);
              }
            } catch (error: any) {
              // Erro ao verificar sessão não deve quebrar a sessão
              console.warn(`[Auth] Erro ao verificar modo somente leitura (não crítico):`, error.message);
              (session as any).isReadOnlyArquiteto = false; // Por padrão, assume que pode editar
            }
          } else {
            // Sem sessionId, assume que pode editar (sessão nova ou antiga)
            (session as any).isReadOnlyArquiteto = false;
          }
        } else {
          // Não é ARQUITETO, não está em modo somente leitura
          (session as any).isReadOnlyArquiteto = false;
        }
      }
      return session;
    },
  },
  pages: { signIn: "/signin" },
  trustHost: true,
};

// Inicializar NextAuth
// No NextAuth v5, a inicialização é feita diretamente
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);