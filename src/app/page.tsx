import { auth } from "@/auth";
import Link from "next/link";
import SessionTimer from "./components/SessionTimer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();

  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        background: "#fafafa",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: 800,
          width: "100%",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 48, marginBottom: 16, fontWeight: 700 }}>
          TNA Studio
        </h1>
        <p style={{ fontSize: 20, marginBottom: 32, color: "#6b7280" }}>
          Plataforma segura para conteúdo sensível
        </p>

        {session ? (
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              marginTop: "2rem",
            }}
          >
            <h2 style={{ fontSize: 24, marginBottom: 16 }}>Bem-vindo!</h2>
            <p style={{ fontSize: 16, marginBottom: 24, color: "#6b7280" }}>
              Você está autenticado como {session.user?.email}
            </p>

            <SessionTimer />

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
                marginTop: "1.5rem",
              }}
            >
              {(session.user as any)?.role === "ADMIN" && (
                <>
                  <Link
                    href="/admin/users"
                    style={{
                      display: "inline-block",
                      background: "#111",
                      color: "#fff",
                      padding: "0.75rem 1.5rem",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontSize: 16,
                      fontWeight: 500,
                    }}
                  >
                    Painel Admin
                  </Link>
                  <Link
                    href="/admin/reports"
                    style={{
                      display: "inline-block",
                      background: "#2563eb",
                      color: "#fff",
                      padding: "0.75rem 1.5rem",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontSize: 16,
                      fontWeight: 500,
                    }}
                  >
                    Relatórios
                  </Link>
                </>
              )}
              <Link
                href="/profile"
                style={{
                  display: "inline-block",
                  background: "#059669",
                  color: "#fff",
                  padding: "0.75rem 1.5rem",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                Meus Dados
              </Link>
              <Link
                href="/galleries"
                style={{
                  display: "inline-block",
                  background: "#7c3aed",
                  color: "#fff",
                  padding: "0.75rem 1.5rem",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                Galerias
              </Link>
            </div>
          </div>
        ) : (
          <Link
            href="/signin"
            style={{
              display: "inline-block",
              background: "#111",
              color: "#fff",
              padding: "1rem 2rem",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 18,
              fontWeight: 600,
              marginTop: "2rem",
            }}
          >
            Entrar
          </Link>
        )}

        <div
          style={{
            marginTop: "4rem",
            padding: "2rem",
            background: "#f9fafb",
            borderRadius: 12,
            textAlign: "left",
          }}
        >
          <h3 style={{ fontSize: 18, marginBottom: 12, fontWeight: 600 }}>
            Segurança e Privacidade
          </h3>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              color: "#6b7280",
              fontSize: 14,
              lineHeight: 1.8,
            }}
          >
            <li>✓ Autenticação obrigatória</li>
            <li>✓ Conteúdo sem cache público</li>
            <li>✓ URLs assinadas efêmeras</li>
            <li>✓ Compliance LGPD/GDPR</li>
            <li>✓ Auditoria completa de acessos</li>
            <li>Este conteúdo é de acesso exclusivo dos clientes. @ todos os direitos reservados </li>
          </ul>
        </div>
      </div>
    </div>
  );
}