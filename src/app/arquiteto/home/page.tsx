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

  // Buscar estatísticas básicas
  const [ensaiosCount, usuariosCount] = await Promise.all([
    prisma.ensaio.count({
      where: { deletedAt: null },
    }),
    prisma.user.count({
      where: { deletedAt: null },
    }),
  ]);

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: "0.5rem" }}>
          Bem-vindo, Arquiteto!
        </h1>
        <p style={{ color: "#6b7280" }}>
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
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>
            {ensaiosCount}
          </div>
          <div style={{ fontSize: 14, color: "#6b7280" }}>Ensaios</div>
        </div>
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>
            {usuariosCount}
          </div>
          <div style={{ fontSize: 14, color: "#6b7280" }}>Usuários</div>
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
          style={{
            display: "block",
            padding: "1.5rem",
            background: "#111827",
            color: "#fff",
            borderRadius: 12,
            textDecoration: "none",
            textAlign: "center",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          📸 Gerenciar Ensaios
        </Link>

        <Link
          href="/admin/users"
          style={{
            display: "block",
            padding: "1.5rem",
            background: "#111827",
            color: "#fff",
            borderRadius: 12,
            textDecoration: "none",
            textAlign: "center",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          👥 Gerenciar Usuários
        </Link>

        <Link
          href="/loja"
          style={{
            display: "block",
            padding: "1.5rem",
            background: "#111827",
            color: "#fff",
            borderRadius: 12,
            textDecoration: "none",
            textAlign: "center",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          🛍️ Loja TNA
        </Link>
      </div>
    </div>
  );
}

