import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ArquitetoHomePage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ARQUITETO") {
    redirect("/signin");
  }

  const userId = (session.user as any)?.id;

  // Buscar estatísticas básicas (com tratamento de erro)
  let ensaiosCount = 0;
  let usuariosCount = 0;
  
  try {
    [ensaiosCount, usuariosCount] = await Promise.all([
      prisma.ensaio.count({
        where: { deletedAt: null },
      }),
      prisma.user.count({
        where: { deletedAt: null },
      }),
    ]);
  } catch (error) {
    console.error("[ArquitetoHomePage] Erro ao buscar estatísticas:", error);
    // Continuar com valores padrão (0) se houver erro
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", minHeight: "60vh" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: "0.5rem", fontFamily: "var(--font-serif)" }}>
          Bem-vindo, Arquiteto!
        </h1>
        <p style={{ color: "#6b7280", fontSize: 16 }}>
          Área administrativa - TNA Studio
        </p>
      </header>

      {/* Estatísticas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div
          className="card-premium"
          style={{
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 700, color: "var(--color-gold-primary)", marginBottom: "0.5rem", fontFamily: "var(--font-serif)" }}>
            {ensaiosCount}
          </div>
          <div style={{ fontSize: 14, color: "var(--color-black-text)" }}>Ensaios</div>
        </div>
        <div
          className="card-premium"
          style={{
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 700, color: "var(--color-gold-primary)", marginBottom: "0.5rem", fontFamily: "var(--font-serif)" }}>
            {usuariosCount}
          </div>
          <div style={{ fontSize: 14, color: "var(--color-black-text)" }}>Usuários</div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1rem",
        }}
      >
        <Link
          href="/arquiteto/ensaios"
          className="card-premium"
          style={{
            display: "block",
            padding: "1.5rem",
            background: "var(--color-gold-primary)",
            color: "#fff",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
            textAlign: "center",
            fontWeight: 600,
            fontSize: 16,
            transition: "all var(--transition-base)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-gold-bright)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--color-gold-primary)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          📸 Gerenciar Ensaios
        </Link>

        <Link
          href="/admin/users"
          className="card-premium"
          style={{
            display: "block",
            padding: "1.5rem",
            background: "var(--color-gold-primary)",
            color: "#fff",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
            textAlign: "center",
            fontWeight: 600,
            fontSize: 16,
            transition: "all var(--transition-base)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-gold-bright)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--color-gold-primary)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          👥 Gerenciar Usuários
        </Link>

        <Link
          href="/loja"
          className="card-premium"
          style={{
            display: "block",
            padding: "1.5rem",
            background: "var(--color-gold-primary)",
            color: "#fff",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
            textAlign: "center",
            fontWeight: 600,
            fontSize: 16,
            transition: "all var(--transition-base)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-gold-bright)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--color-gold-primary)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          🛍️ Loja TNA
        </Link>
      </div>
    </div>
  );
}

