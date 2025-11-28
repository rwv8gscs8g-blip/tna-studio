import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";
import ProdutoFormClient from "../components/ProdutoFormClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarProdutoPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any)?.role as Role;
  
  // Apenas ARQUITETO pode acessar
  if (userRole !== Role.ARQUITETO) {
    redirect("/");
  }

  const { id } = await params;

  // Buscar produto
  const produto = await prisma.produto.findUnique({
    where: { 
      id,
      deletedAt: null,
    },
    include: {
      photos: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!produto) {
    notFound();
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <p style={{ fontSize: 12, letterSpacing: 1, color: "#9ca3af" }}>
          Gerenciamento de Produtos
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: "0.5rem" }}>
          Editar Produto
        </h1>
        <p style={{ color: "#6b7280" }}>
          {produto.nome}
        </p>
      </header>

      <ProdutoFormClient produto={produto} />
    </div>
  );
}

