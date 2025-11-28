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

  // Buscar todos os produtos ativos
  const produtos = await prisma.produto.findMany({
    where: {
      deletedAt: null,
      isActive: true,
    },
    include: {
      _count: {
        select: {
          ensaios: true,
          intencoes: true,
        },
      },
    },
    orderBy: [
      { displayOrder: "asc" }, // Por ordem de exibição
      { categoria: "asc" },
      { nome: "asc" },
    ],
  });

  // Separar produtos por categoria
  const produtosCortesia = produtos.filter((p) => p.categoria === "Cortesia" || !p.precoEuro);
  const produtosServico = produtos.filter((p) => p.categoria === "Serviço" && p.precoEuro);
  const produtosBook = produtos.filter((p) => p.categoria === "Book" && p.precoEuro);
  const produtosOutros = produtos.filter((p) => !["Cortesia", "Serviço", "Book"].includes(p.categoria || ""));

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

      {/* Seção Books */}
      {produtosBook.length > 0 && (
        <section style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: "1.5rem", color: "#111827" }}>
            📚 Books
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {produtosBook.map((produto) => (
              <ProductCard key={produto.id} produto={produto} />
            ))}
          </div>
        </section>
      )}

      {/* Seção Serviços */}
      {produtosServico.length > 0 && (
        <section style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: "1.5rem", color: "#111827" }}>
            🎯 Serviços
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {produtosServico.map((produto) => (
              <ProductCard key={produto.id} produto={produto} />
            ))}
          </div>
        </section>
      )}

      {/* Seção Cortesias */}
      {produtosCortesia.length > 0 && (
        <section style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: "1.5rem", color: "#111827" }}>
            🎁 Cortesias
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {produtosCortesia.map((produto) => (
              <ProductCard key={produto.id} produto={produto} />
            ))}
          </div>
        </section>
      )}

      {/* Seção Outros */}
      {produtosOutros.length > 0 && (
        <section>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: "1.5rem", color: "#111827" }}>
            Outros Produtos
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {produtosOutros.map((produto) => (
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

