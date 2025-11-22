import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import SessionTimer from "./components/SessionTimer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HomePage(props: {
  searchParams?: Promise<{ logout?: string }>;
}) {
  let session = null;
  try {
    session = await auth();
  } catch (error: any) {
    console.error("[HomePage] Erro ao obter sessão:", error);
    // Continua sem sessão se houver erro
  }
  const params = props.searchParams ? await props.searchParams : {};

  // Se há sessão, redirecionar para página apropriada
  if (session) {
    const userRole = (session.user as any)?.role;
    if (userRole === "ARQUITETO") {
      redirect("/arquiteto/ensaios");
    } else if (userRole === "ADMIN") {
      redirect("/admin/reports");
    } else if (userRole === "MODELO") {
      redirect("/modelo/ensaios");
    } else if (userRole === "CLIENTE") {
      redirect("/");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: 600,
          width: "100%",
          textAlign: "center",
        }}
      >
        {params.logout === "success" && !session && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 12,
              padding: "1rem",
              marginBottom: "2rem",
              color: "#065f46",
              fontSize: 14,
            }}
          >
            Logout realizado com sucesso. Faça login novamente para continuar.
          </div>
        )}

        <div
          style={{
            background: "white",
            borderRadius: 16,
            padding: "3rem 2.5rem",
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            marginBottom: "2rem",
          }}
        >
          <h1 style={{ fontSize: 48, marginBottom: 12, fontWeight: 700, color: "#111827" }}>
            TNA-Studio
          </h1>
          <p style={{ fontSize: 22, marginBottom: 40, color: "#6b7280", fontWeight: 400 }}>
            Você como uma obra de arte
          </p>
          <p style={{ fontSize: 16, marginBottom: 48, color: "#9ca3af" }}>
            Plataforma segura para conteúdo sensível
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            <Link
              href="/signin"
              style={{
                display: "inline-block",
                background: "#111827",
                color: "#fff",
                padding: "1rem 2rem",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 16,
                fontWeight: 600,
                transition: "all 0.2s",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#1f2937";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#111827";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Entrar
            </Link>

            <Link
              href="/modelo/signup"
              style={{
                display: "inline-block",
                background: "transparent",
                color: "#111827",
                padding: "1rem 2rem",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 16,
                fontWeight: 600,
                border: "2px solid #e5e7eb",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#111827";
                e.currentTarget.style.background = "#f9fafb";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Criar Conta (Modelo)
            </Link>
          </div>

          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              paddingTop: "1.5rem",
              marginTop: "2rem",
            }}
          >
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: "0.75rem" }}>
              Funcionalidades em breve:
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                disabled
                style={{
                  padding: "0.5rem 1rem",
                  background: "#f3f4f6",
                  color: "#9ca3af",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "not-allowed",
                }}
              >
                Token Mágico
              </button>
              <button
                disabled
                style={{
                  padding: "0.5rem 1rem",
                  background: "#f3f4f6",
                  color: "#9ca3af",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "not-allowed",
                }}
              >
                Esqueci minha senha
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}