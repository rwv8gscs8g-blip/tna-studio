import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";
import ProductDetailClient from "../produto/[id]/components/ProductDetailClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailBySlugPage({ params }: PageProps) {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/signin");
  }

  const { slug } = await params;

  // Buscar produto por slug
  const produto = await prisma.produto.findUnique({
    where: { 
      slug,
      deletedAt: null,
      isActive: true,
    },
    include: {
      photos: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
      },
      _count: {
        select: {
          ensaios: true,
          intencoes: true,
        },
      },
    },
  });

  if (!produto) {
    notFound();
  }

  const userRole = (session.user as any)?.role as Role;
  const userId = (session.user as any)?.id;

  // Buscar intenção existente se for MODELO
  let intencaoExistente = null;
  if (userRole === Role.MODELO) {
    intencaoExistente = await prisma.intencaoCompra.findFirst({
      where: {
        modeloId: userId,
        produtoId: produto.id,
        status: "PENDENTE",
      },
    });
  }

  return (
    <ProductDetailClient
      produto={produto}
      userRole={userRole}
      intencaoExistente={intencaoExistente}
    />
  );
}

