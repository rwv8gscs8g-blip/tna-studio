import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ClienteHomePage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "CLIENTE") {
    redirect("/signin");
  }

  const userId = (session.user as any)?.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      birthDate: true,
      profileImage: true,
    },
  });

  if (!user) {
    redirect("/signin");
  }

  // Buscar estatísticas básicas
  const ensaiosCount = await prisma.ensaio.count({
    where: {
      status: "PUBLISHED",
      // TODO: Filtrar por cliente quando houver relação
    },
  });

  const formatCpf = (cpf: string | null) => {
    if (!cpf) return "—";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: "0.5rem" }}>
          Área do Cliente – TNA Studio
        </h1>
        <p style={{ color: "#6b7280", fontSize: 16, lineHeight: 1.6 }}>
          Esta área está em desenvolvimento e será usada para visualizar ensaios liberados para você.
        </p>
      </header>

      {/* Perfil resumido */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          padding: "2rem",
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2rem", alignItems: "center" }}>
          {user.profileImage ? (
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                overflow: "hidden",
                backgroundColor: "#f3f4f6",
              }}
            >
              <img
                src={user.profileImage}
                alt={user.name || "Cliente"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ) : (
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                backgroundColor: "#e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3af",
                fontSize: 48,
                fontWeight: 700,
              }}
            >
              {(user.name || user.email || "C")[0].toUpperCase()}
            </div>
          )}

          <div>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: "0.5rem" }}>
              {user.name || "Sem nome"}
            </h2>
            <div style={{ display: "grid", gap: "0.5rem", fontSize: 14, color: "#6b7280" }}>
              <div>
                <strong>E-mail:</strong> {user.email}
              </div>
              {user.cpf && (
                <div>
                  <strong>CPF:</strong> {formatCpf(user.cpf)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
          <div style={{ fontSize: 14, color: "#6b7280" }}>Ensaios Disponíveis</div>
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


