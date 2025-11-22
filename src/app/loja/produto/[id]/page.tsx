import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";
import ProductDetailClient from "./components/ProductDetailClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const { id } = await params;

  const produto = await prisma.produto.findUnique({
    where: { id },
    include: {
      photos: {
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
        produtoId: id,
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

