import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ProjetosPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any)?.role as Role;
  
  // Apenas ARQUITETO e ADMIN podem ver projetos
  if (userRole !== Role.ARQUITETO && userRole !== Role.ADMIN) {
    redirect("/signin");
  }

  const canEdit = userRole === Role.ARQUITETO;

  // Buscar projetos
  const projetos = await prisma.projeto.findMany({
    include: {
      _count: {
        select: {
          ensaios: true, // Conta através da relação EnsaioProjeto (nome da relação no schema)
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <p style={{ fontSize: 12, letterSpacing: 1, color: "#9ca3af" }}>
          Gerenciamento de Projetos
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: "0.5rem" }}>
          Projetos de Ensaios
        </h1>
        <p style={{ color: "#6b7280" }}>
          Organize seus ensaios em projetos temáticos.
        </p>
      </header>

      {canEdit && (
        <div style={{ marginBottom: "2rem" }}>
          <Link
            href="/projetos/new"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              background: "#111827",
              color: "#fff",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            ➕ Novo Projeto
          </Link>
        </div>
      )}

      {!canEdit && (
        <div
          style={{
            padding: "1rem",
            background: "#f3f4f6",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            marginBottom: "2rem",
            fontSize: 14,
            color: "#6b7280",
          }}
        >
          <strong>Somente leitura:</strong> Você pode visualizar os projetos, mas não pode criar ou editar.
        </div>
      )}

      {projetos.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: "3rem 2rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 16, color: "#6b7280", marginBottom: "0.5rem" }}>
            Nenhum projeto cadastrado ainda.
          </p>
          {canEdit && (
            <p style={{ fontSize: 14, color: "#9ca3af" }}>
              Crie seu primeiro projeto acima.
            </p>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "1rem",
          }}
        >
          {projetos.map((projeto) => (
            <div
              key={projeto.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "1.5rem",
                backgroundColor: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                    {projeto.name}
                  </h3>
                  <span
                    style={{
                      padding: "0.25rem 0.5rem",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: projeto.active ? "#dcfce7" : "#f3f4f6",
                      color: projeto.active ? "#166534" : "#6b7280",
                      textTransform: "uppercase",
                    }}
                  >
                    {projeto.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                {projeto.description && (
                  <p style={{ color: "#6b7280", marginBottom: "0.5rem", fontSize: 14 }}>
                    {projeto.description}
                  </p>
                )}
                <div style={{ fontSize: 13, color: "#9ca3af" }}>
                  <p>
                    <strong>Slug:</strong> {projeto.slug}
                  </p>
                  <p>
                    <strong>Ensaios vinculados:</strong> {projeto._count.ensaios}
                  </p>
                </div>
              </div>
              {canEdit && (
                <Link
                  href={`/projetos/${projeto.id}/edit`}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#111827",
                    color: "#fff",
                    borderRadius: 6,
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Editar
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

