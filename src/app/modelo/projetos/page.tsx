import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ModeloProjetosPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any)?.role as Role;
  const userId = (session.user as any)?.id;
  const userCpf = (session.user as any)?.cpf as string | null;
  
  // Apenas MODELO pode acessar
  if (userRole !== Role.MODELO) {
    redirect("/");
  }

  // Buscar ensaios da modelo
  const ensaios = await prisma.ensaio.findMany({
    where: {
      subjectCpf: userCpf || undefined,
      status: "PUBLISHED", // Apenas ensaios publicados
    },
    include: {
      projetos: {
        include: {
          projeto: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              active: true,
            },
          },
        },
      },
    },
    orderBy: {
      shootDate: "desc",
    },
  });

  // Extrair projetos únicos dos ensaios da modelo
  const projetosDaModelo = new Map<string, {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    active: boolean;
    ensaiosCount: number;
  }>();

  ensaios.forEach((ensaio) => {
    ensaio.projetos.forEach((ep) => {
      const projeto = ep.projeto;
      if (projetosDaModelo.has(projeto.id)) {
        const existing = projetosDaModelo.get(projeto.id)!;
        existing.ensaiosCount++;
      } else {
        projetosDaModelo.set(projeto.id, {
          ...projeto,
          ensaiosCount: 1,
        });
      }
    });
  });

  const meusProjetos = Array.from(projetosDaModelo.values());

  // Buscar todos os projetos ativos (para seção "Outros projetos")
  const todosProjetos = await prisma.projeto.findMany({
    where: {
      active: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      active: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Filtrar projetos que não são da modelo
  const outrosProjetos = todosProjetos.filter(
    (p) => !projetosDaModelo.has(p.id)
  );

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: "0.5rem" }}>
          Projetos
        </h1>
        <p style={{ color: "#6b7280" }}>
          Projetos de ensaios fotográficos do TNA-Studio.
        </p>
      </header>

      {/* Seção: Meus Projetos */}
      {meusProjetos.length > 0 && (
        <section style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem", color: "#111827" }}>
            Meus Projetos
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: "1.5rem" }}>
            Projetos dos quais você participa:
          </p>
          <div
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
            {meusProjetos.map((projeto) => (
              <div
                key={projeto.id}
                style={{
                  border: "2px solid #111827",
                  borderRadius: 12,
                  padding: "1.5rem",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
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
                      backgroundColor: "#dcfce7",
                      color: "#166534",
                      textTransform: "uppercase",
                    }}
                  >
                    Participando
                  </span>
                </div>
                {projeto.description && (
                  <p style={{ color: "#6b7280", marginBottom: "0.5rem", fontSize: 14 }}>
                    {projeto.description}
                  </p>
                )}
                <div style={{ fontSize: 13, color: "#9ca3af" }}>
                  <p>
                    <strong>Ensaios neste projeto:</strong> {projeto.ensaiosCount}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Seção: Outros Projetos */}
      {outrosProjetos.length > 0 && (
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem", color: "#111827" }}>
            Outros Projetos
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: "1.5rem" }}>
            Outros projetos disponíveis no TNA-Studio:
          </p>
          <div
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
            {outrosProjetos.map((projeto) => (
              <div
                key={projeto.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "1.5rem",
                  backgroundColor: "#ffffff",
                }}
              >
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
                      backgroundColor: "#f3f4f6",
                      color: "#6b7280",
                      textTransform: "uppercase",
                    }}
                  >
                    Disponível
                  </span>
                </div>
                {projeto.description && (
                  <p style={{ color: "#6b7280", marginBottom: "0.5rem", fontSize: 14 }}>
                    {projeto.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mensagem quando não há projetos */}
      {meusProjetos.length === 0 && outrosProjetos.length === 0 && (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: "3rem 2rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 16, color: "#6b7280" }}>
            Nenhum projeto disponível no momento.
          </p>
        </div>
      )}
    </div>
  );
}

