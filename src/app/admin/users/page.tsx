import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CreateUserForm from "./components/CreateUserForm";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/signin");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ padding: "2rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <p style={{ fontSize: 12, letterSpacing: 1, color: "#9ca3af" }}>
            Controle interno
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Painel de Usuários</h1>
          <p style={{ color: "#6b7280" }}>
            Lista de contas registradas no banco `tna_studio`.
          </p>
        </div>
        <Link
          href="/"
          style={{
            textDecoration: "none",
            padding: "0.65rem 1.25rem",
            background: "#111827",
            color: "#fff",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          Voltar
        </Link>
      </header>

      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "minmax(260px, 1fr) 2fr",
          alignItems: "start",
        }}
      >
        <CreateUserForm roles={Object.values(Role)} />

        <div style={{ overflowX: "auto", background: "#fff", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "0.85rem" }}>Nome</th>
              <th style={{ padding: "0.85rem" }}>Email</th>
              <th style={{ padding: "0.85rem" }}>Perfil</th>
              <th style={{ padding: "0.85rem" }}>Criado em</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={{ padding: "0.85rem" }}>{user.name ?? "—"}</td>
                <td style={{ padding: "0.85rem" }}>{user.email}</td>
                <td style={{ padding: "0.85rem", textTransform: "capitalize" }}>
                  {user.role.toLowerCase()}
                </td>
                <td style={{ padding: "0.85rem", color: "#6b7280" }}>
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

            {users.length === 0 && (
              <p style={{ padding: "1rem", color: "#6b7280" }}>
                Nenhum usuário encontrado.
              </p>
            )}
        </div>
      </div>
    </div>
  );
}

