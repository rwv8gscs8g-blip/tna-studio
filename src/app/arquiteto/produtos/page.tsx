import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import ProdutosListClient from "./components/ProdutosListClient";
import ButtonLink from "@/components/ui/ButtonLink";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any)?.role as Role;
  
  // Apenas ARQUITETO pode acessar
  if (userRole !== Role.ARQUITETO) {
    redirect("/");
  }

  // Buscar todos os produtos (incluindo inativos para gestão)
  const produtos = await prisma.produto.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      photos: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
        take: 1, // Apenas primeira foto para thumbnail
      },
      _count: {
        select: {
          ensaios: true,
          intencoes: true,
        },
      },
    },
    orderBy: [
      { displayOrder: "asc" },
      { isActive: "desc" },
      { categoria: "asc" },
      { nome: "asc" },
    ],
  });

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 12, letterSpacing: 1, color: "#9ca3af" }}>
            Gerenciamento de Produtos
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: "0.5rem" }}>
            Produtos Fotográficos
          </h1>
          <p style={{ color: "#6b7280" }}>
            Gerencie os produtos disponíveis na loja.
          </p>
        </div>
        <ButtonLink href="/arquiteto/produtos/novo">
          ➕ Novo Produto
        </ButtonLink>
      </header>

      <ProdutosListClient produtos={produtos} />
    </div>
  );
}

