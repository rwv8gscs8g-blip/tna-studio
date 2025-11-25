import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ModeloHomePage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "MODELO") {
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

  // Calcular idade
  let idade: number | null = null;
  if (user.birthDate) {
    const today = new Date();
    const birth = new Date(user.birthDate);
    idade = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      idade--;
    }
  }

  // Buscar estatísticas
  const [ensaiosCount, intencoesCount] = await Promise.all([
    prisma.ensaio.count({
      where: {
        subjectCpf: user.cpf,
        status: "PUBLISHED",
      },
    }),
    prisma.intencaoCompra.count({
      where: {
        modeloId: userId,
        status: "PENDENTE",
      },
    }),
  ]);

  const formatCpf = (cpf: string | null) => {
    if (!cpf) return "—";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: "0.5rem" }}>
          Bem-vinda, {user.name || user.email}!
        </h1>
        <p style={{ color: "#6b7280" }}>
          Área interna da modelo - TNA Studio
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
                alt={user.name || "Modelo"}
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
              {(user.name || user.email || "M")[0].toUpperCase()}
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
              <div>
                <strong>CPF:</strong> {formatCpf(user.cpf)}
              </div>
              {idade !== null && (
                <div>
                  <strong>Idade:</strong> {idade} anos
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
          <div style={{ fontSize: 14, color: "#6b7280" }}>Ensaios Publicados</div>
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
            {intencoesCount}
          </div>
          <div style={{ fontSize: 14, color: "#6b7280" }}>Intenções Pendentes</div>
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
          href="/modelo/ensaios"
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
          📸 Meus Ensaios
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

        <Link
          href="/projetos"
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
          📁 Projetos que participo
        </Link>

        <Link
          href="/modelo/intencoes"
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
          💼 Meus contratos
        </Link>

        <div
          style={{
            display: "block",
            padding: "1.5rem",
            background: "#f3f4f6",
            color: "#6b7280",
            borderRadius: 12,
            textAlign: "center",
            fontWeight: 600,
            fontSize: 16,
            cursor: "not-allowed",
          }}
        >
          ✨ Magic Login via WhatsApp / SMS (em breve)
        </div>
      </div>
    </div>
  );
}

