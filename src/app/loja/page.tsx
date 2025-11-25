import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProductCard from "@/app/components/ProductCard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function LojaPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/signin");
  }

  // Buscar todos os produtos
  const produtos = await prisma.produto.findMany({
    include: {
      _count: {
        select: {
          ensaios: true,
          intencoes: true,
        },
      },
    },
    orderBy: [
      { isTfp: "desc" }, // TFP primeiro
      { isPromocao: "desc" }, // Promoções depois
      { nome: "asc" },
    ],
  });

  // Separar produtos por categoria
  const produtosTfp = produtos.filter((p) => p.isTfp);
  const produtosPromocao = produtos.filter((p) => p.isPromocao && !p.isTfp);
  const produtosNormais = produtos.filter((p) => !p.isPromocao && !p.isTfp);

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <p style={{ fontSize: 12, letterSpacing: 1, color: "#9ca3af" }}>
          Loja TNA Studio
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: "0.5rem" }}>
          Produtos Fotográficos
        </h1>
        <p style={{ color: "#6b7280" }}>
          Escolha o pacote ideal para seu ensaio fotográfico.
        </p>
      </header>

      {/* Seção TFP / Permuta */}
      {produtosTfp.length > 0 && (
        <section style={{ marginBottom: "3rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>
              🔥 Promoção / Permuta TFP
            </h2>
            <span
              style={{
                padding: "0.25rem 0.75rem",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                backgroundColor: "#fef3c7",
                color: "#92400e",
                textTransform: "uppercase",
              }}
            >
              Em Destaque
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {produtosTfp.map((produto) => (
              <ProductCard key={produto.id} produto={produto} />
            ))}
          </div>
        </section>
      )}

      {/* Seção Promoções */}
      {produtosPromocao.length > 0 && (
        <section style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: "1.5rem", color: "#111827" }}>
            Promoções
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {produtosPromocao.map((produto) => (
              <ProductCard key={produto.id} produto={produto} />
            ))}
          </div>
        </section>
      )}

      {/* Seção Produtos Normais */}
      {produtosNormais.length > 0 && (
        <section>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: "1.5rem", color: "#111827" }}>
            Todos os Produtos
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {produtosNormais.map((produto) => (
              <ProductCard key={produto.id} produto={produto} />
            ))}
          </div>
        </section>
      )}

      {produtos.length === 0 && (
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
            Nenhum produto disponível no momento.
          </p>
        </div>
      )}
    </div>
  );
}

