import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ModeloIntencoesPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "MODELO") {
    redirect("/signin");
  }

  const userId = (session.user as any)?.id;

  const intencoes = await prisma.intencaoCompra.findMany({
    where: { modeloId: userId },
    include: {
      produto: {
        select: {
          id: true,
          nome: true,
          preco: true,
          isTfp: true,
          coverImageKey: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatPrice = (price: number) => {
    if (price === 0) return "TFP / Permuta";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDENTE":
        return { bg: "#fef3c7", color: "#92400e", border: "#fbbf24" };
      case "APROVADA":
        return { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" };
      case "REJEITADA":
        return { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" };
      case "CONCLUIDA":
        return { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" };
      default:
        return { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link
          href="/modelo/home"
          style={{
            display: "inline-block",
            fontSize: 14,
            color: "#6b7280",
            textDecoration: "none",
            marginBottom: "0.5rem",
          }}
        >
          ← Voltar para Home
        </Link>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: "0.5rem" }}>
          Meus Contratos e Intenções
        </h1>
        <p style={{ color: "#6b7280" }}>
          Acompanhe suas intenções de compra e contratos de ensaios.
        </p>
      </header>

      {intencoes.length === 0 ? (
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
            Você ainda não tem intenções de compra.
          </p>
          <p style={{ fontSize: 14, color: "#9ca3af" }}>
            Visite a <Link href="/loja" style={{ color: "#111827", fontWeight: 600 }}>Loja TNA</Link> para
            selecionar produtos.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {intencoes.map((intencao) => {
            const statusColors = getStatusColor(intencao.status);
            return (
              <div
                key={intencao.id}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  padding: "1.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                      {intencao.produto.nome}
                    </h3>
                    <span
                      style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: statusColors.bg,
                        color: statusColors.color,
                        border: `1px solid ${statusColors.border}`,
                        textTransform: "uppercase",
                      }}
                    >
                      {intencao.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: "#6b7280" }}>
                    <p>
                      <strong>Preço:</strong> {formatPrice(intencao.produto.preco)}
                    </p>
                    <p>
                      <strong>Solicitado em:</strong>{" "}
                      {new Date(intencao.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/loja/produto/${intencao.produto.id}`}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "#111827",
                    color: "#fff",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Ver Produto →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

