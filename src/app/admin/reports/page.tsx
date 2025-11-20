import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/signin");
  }

  const [totals, latestUsers] = await Promise.all([
    prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, email: true, role: true, createdAt: true },
    }),
  ]);

  const totalUsers = totals.reduce((acc, item) => acc + item._count.role, 0);

  const cards = [
    { label: "Total de usuários", value: totalUsers },
    {
      label: "Administradores",
      value: totals.find((t) => t.role === "ADMIN")?._count.role ?? 0,
    },
    {
      label: "Modelos",
      value: totals.find((t) => t.role === "MODEL")?._count.role ?? 0,
    },
    {
      label: "Clientes",
      value: totals.find((t) => t.role === "CLIENT")?._count.role ?? 0,
    },
  ];

  return (
    <div style={{ padding: "2.5rem 2rem", background: "#f9fafb", minHeight: "100vh" }}>
      <header style={{ marginBottom: "2rem" }}>
        <p style={{ color: "#9ca3af", textTransform: "uppercase", fontSize: 12 }}>
          Monitoramento interno
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 700 }}>Relatórios do TNA Studio</h1>
        <p style={{ color: "#6b7280" }}>
          Visão rápida da base de usuários e últimos cadastros da instância atual.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        {cards.map((card) => (
          <div
            key={card.label}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "1.25rem",
              boxShadow: "0 5px 20px rgba(15,23,42,0.05)",
            }}
          >
            <p style={{ color: "#6b7280", fontSize: 14 }}>{card.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700 }}>{card.value}</p>
          </div>
        ))}
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "1.5rem",
          boxShadow: "0 8px 30px rgba(15,23,42,0.08)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>Últimos cadastros</h2>
            <p style={{ color: "#6b7280", fontSize: 14 }}>
              Últimos 5 usuários criados no banco `tna_studio`.
            </p>
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "0.75rem" }}>Email</th>
              <th style={{ padding: "0.75rem" }}>Perfil</th>
              <th style={{ padding: "0.75rem" }}>Criado em</th>
            </tr>
          </thead>
          <tbody>
            {latestUsers.map((user) => (
              <tr key={user.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={{ padding: "0.75rem" }}>{user.email}</td>
                <td style={{ padding: "0.75rem", textTransform: "capitalize" }}>
                  {user.role.toLowerCase()}
                </td>
                <td style={{ padding: "0.75rem", color: "#6b7280" }}>
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

