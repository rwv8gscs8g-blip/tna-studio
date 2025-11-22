import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CreateUserForm from "./components/CreateUserForm";
import EditUserButton from "./components/EditUserButton";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();
  const userRole = (session.user as any)?.role;
  // ADMIN e ARQUITETO podem acessar (ADMIN somente leitura, ARQUITETO pode editar)
  if (!session || (userRole !== "ADMIN" && userRole !== "ARQUITETO")) {
    redirect("/signin");
  }

  // Flag para controlar permissões de edição
  // ARQUITETO sempre pode editar, independente de sessão ou modo somente leitura
  const canEdit = userRole === "ARQUITETO";

  // Buscar TODOS os usuários (incluindo SUPERADMIN)
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      cpf: true,
      phone: true,
      birthDate: true,
    },
    orderBy: { createdAt: "desc" },
    // Sem filtro - mostra todos os usuários
  });

  return (
    <div style={{ padding: "2rem" }}>
      {/* Banner amarelo só aparece para ADMIN (não para ARQUITETO) */}
      {userRole !== "ARQUITETO" && (
        <div
          style={{
            padding: "1rem",
            background: "#fef3c7",
            border: "1px solid #fbbf24",
            borderRadius: 8,
            marginBottom: "1.5rem",
            fontSize: 14,
            color: "#92400e",
          }}
        >
          <strong>⚠️ Somente leitura:</strong> Você não tem permissão para criar ou editar usuários. Apenas o ARQUITETO pode fazer alterações.
        </div>
      )}
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
          gridTemplateColumns: canEdit ? "minmax(260px, 1fr) 2fr" : "1fr",
          alignItems: "start",
        }}
      >
        {canEdit ? (
          <CreateUserForm roles={Object.values(Role)} />
        ) : (
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "1.25rem",
              border: "1px solid #e5e7eb",
            }}
          >
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: "0.5rem" }}>
              <strong>Somente leitura</strong>
            </p>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>
              Somente o ARQUITETO pode criar ou editar usuários. Perfil atual: ADMIN.
            </p>
          </div>
        )}

        <div style={{ overflowX: "auto", background: "#fff", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "0.85rem" }}>Nome</th>
              <th style={{ padding: "0.85rem" }}>Email</th>
              <th style={{ padding: "0.85rem" }}>Perfil</th>
              <th style={{ padding: "0.85rem" }}>Criado em</th>
              <th style={{ padding: "0.85rem" }}>Ações</th>
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
                <td style={{ padding: "0.85rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <EditUserButton userId={user.id} canEdit={canEdit} />
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

