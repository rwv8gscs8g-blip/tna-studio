import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import EnsaiosListClient from "./components/EnsaiosListClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{ page?: string; modeloId?: string; projetoId?: string; produtoId?: string; status?: string }>;
}

export default async function ArquitetoEnsaiosPage({ searchParams }: PageProps) {
  const session = await auth();
  
  // Proteção robusta
  if (!session || !session.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any).role;
  
  if (userRole !== "ARQUITETO" && userRole !== "ADMIN") {
    redirect("/");
  }

  const userId = (session.user as any)?.id;
  const params = await searchParams;
  const currentPage = parseInt(params?.page || "1", 10);
  const pageSize = 50;
  const skip = (currentPage - 1) * pageSize;
  
  // Verificar se está em modo somente leitura (apenas para ARQUITETO)
  const isReadOnlyArquiteto = userRole === "ARQUITETO" && (session as any)?.isReadOnlyArquiteto === true;
  const canEdit = userRole === "ARQUITETO" && !isReadOnlyArquiteto;

  // Construir filtros
  const where: any = {};
  if (userRole === "ARQUITETO") {
    where.createdById = userId;
  }
  if (params?.modeloId) {
    where.subjectCpf = params.modeloId;
  }
  if (params?.status) {
    where.status = params.status;
  }
  if (params?.projetoId) {
    where.projetos = {
      some: {
        projetoId: params.projetoId,
      },
    };
  }
  if (params?.produtoId) {
    where.produtos = {
      some: {
        produtoId: params.produtoId,
      },
    };
  }

  // Buscar total de ensaios para paginação
  const totalEnsaios = await prisma.ensaio.count({ where });

  const totalPages = Math.ceil(totalEnsaios / pageSize);

  // Buscar ensaios com paginação
  const ensaios = await prisma.ensaio.findMany({
    where,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      shootDate: true,
      status: true,
      subjectCpf: true,
      coverImageKey: true,
      termPdfKey: true,
      syncFolderUrl: true,
      createdAt: true,
      updatedAt: true,
      subject: {
        select: {
          name: true,
          email: true,
          cpf: true,
        },
      },
      projetos: {
        select: {
          projeto: {
            select: {
              id: true,
              name: true,
              active: true,
            },
          },
        },
      },
      produtos: {
        select: {
          produto: {
            select: {
              id: true,
              nome: true,
              isTfp: true,
            },
          },
        },
      },
    },
    orderBy: [
      { shootDate: "desc" },
      { createdAt: "desc" },
    ],
    skip,
    take: pageSize,
  });

  // Buscar todos os modelos, projetos e produtos para filtros
  const [modelos, projetos, produtos] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.MODELO },
      select: { id: true, name: true, email: true, cpf: true },
      orderBy: { name: "asc" },
    }),
    prisma.projeto.findMany({
      where: { active: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.produto.findMany({
      select: { id: true, nome: true, isTfp: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {isReadOnlyArquiteto && (
        <div
          style={{
            padding: "1rem",
            background: "#fef3c7",
            border: "1px solid #fbbf24",
            borderRadius: 8,
            marginBottom: "2rem",
            fontSize: 14,
            color: "#92400e",
          }}
        >
          <strong>⚠️ Modo somente leitura:</strong> Você está em modo somente leitura porque existe outra sessão ativa do Arquiteto. Para retomar os poderes de edição, faça login novamente neste dispositivo.
        </div>
      )}
      
      <header style={{ marginBottom: "2rem" }}>
        <p style={{ fontSize: 12, letterSpacing: 1, color: "#9ca3af" }}>
          Gerenciamento de Ensaios
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: "0.5rem" }}>
          Ensaios Fotográficos
        </h1>
        <p style={{ color: "#6b7280" }}>
          Crie e gerencie seus ensaios fotográficos.
        </p>
      </header>

      {/* Botão Criar Ensaio (apenas para ARQUITETO com permissão) */}
      {canEdit && (
        <div style={{ marginBottom: "2rem" }}>
          <Link
            href="/arquiteto/ensaios/new"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              background: "#111827",
              color: "#fff",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            ➕ Criar Novo Ensaio
          </Link>
        </div>
      )}
      
      {!canEdit && userRole === "ADMIN" && (
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
          <strong>Somente leitura:</strong> Você pode visualizar os ensaios, mas não pode criar ou editar.
        </div>
      )}

      {/* Lista de ensaios com grid 3 colunas, paginação e filtros */}
      <EnsaiosListClient
        ensaios={ensaios}
        modelos={modelos}
        projetos={projetos}
        produtos={produtos}
        currentPage={currentPage}
        totalPages={totalPages}
        totalEnsaios={totalEnsaios}
        canEdit={canEdit}
        searchParams={params}
      />
    </div>
  );
}
