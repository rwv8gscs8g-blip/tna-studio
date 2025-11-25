import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role, EnsaioStatus } from "@prisma/client";
import DownloadTermButton from "./components/DownloadTermButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ModeloContratosPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any)?.role as Role;
  const userCpf = (session.user as any)?.cpf as string | null;
  
  // Apenas MODELO pode acessar
  if (userRole !== Role.MODELO) {
    redirect("/");
  }

  if (!userCpf) {
    return (
      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 16, color: "#6b7280" }}>
            CPF não encontrado. Entre em contato com o suporte.
          </p>
        </div>
      </div>
    );
  }

  // Buscar ensaios da modelo ordenados por data (mais recente primeiro)
  const ensaios = await prisma.ensaio.findMany({
    where: {
      subjectCpf: userCpf,
      status: EnsaioStatus.PUBLISHED, // Apenas ensaios publicados (nunca DRAFT ou DELETED)
      termPdfKey: { not: null }, // Apenas ensaios com termo assinado
    },
    include: {
      projetos: {
        include: {
          projeto: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      produtos: {
        include: {
          produto: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      },
    },
    orderBy: {
      shootDate: "desc", // Mais recente primeiro
    },
  });

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: "0.5rem" }}>
          Meus Contratos
        </h1>
        <p style={{ color: "#6b7280" }}>
          Contratos de ensaios que você assinou, organizados por data.
        </p>
      </header>

      {ensaios.length === 0 ? (
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
            Você ainda não possui contratos assinados.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "1.5rem",
          }}
        >
          {ensaios.map((ensaio) => {
            const formatDate = (date: Date | null) => {
              if (!date) return "Data não informada";
              return new Intl.DateTimeFormat("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }).format(new Date(date));
            };

            return (
              <div
                key={ensaio.id}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  padding: "1.5rem",
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: "1.5rem",
                  alignItems: "center",
                }}
              >
                {/* Thumbnail da capa */}
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: 8,
                    overflow: "hidden",
                    backgroundColor: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {ensaio.coverImageKey ? (
                    <img
                      src={`/api/ensaios/${ensaio.id}/cover`}
                      alt={ensaio.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div style="color: #9ca3af; font-size: 12px;">Sem capa</div>';
                        }
                      }}
                    />
                  ) : (
                    <div style={{ color: "#9ca3af", fontSize: 12, textAlign: "center" }}>
                      Sem capa
                    </div>
                  )}
                </div>

                {/* Informações do contrato */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: "0.5rem" }}>
                    {ensaio.title}
                  </h3>
                  <div style={{ display: "grid", gap: "0.5rem", fontSize: 14, color: "#6b7280", marginBottom: "0.75rem" }}>
                    <div>
                      <strong>Data do ensaio:</strong> {formatDate(ensaio.shootDate)}
                    </div>
                    {ensaio.projetos.length > 0 && (
                      <div>
                        <strong>Projetos:</strong>{" "}
                        {ensaio.projetos.map((ep, idx) => (
                          <span key={ep.projeto.id}>
                            {ep.projeto.name}
                            {idx < ensaio.projetos.length - 1 && ", "}
                          </span>
                        ))}
                      </div>
                    )}
                    {ensaio.produtos.length > 0 && (
                      <div>
                        <strong>Produtos:</strong>{" "}
                        {ensaio.produtos.map((ep, idx) => (
                          <span key={ep.produto.id}>
                            {ep.produto.nome}
                            {idx < ensaio.produtos.length - 1 && ", "}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botão de download */}
                <div>
                  <DownloadTermButton ensaioId={ensaio.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

