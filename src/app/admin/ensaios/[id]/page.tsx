/**
 * Página de detalhes do ensaio para ADMIN (somente leitura)
 */

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";
import Link from "next/link";
import EnsaioCoverClient from "@/app/arquiteto/ensaios/components/EnsaioCoverClient";
import EnsaioPhotosClient from "@/app/modelo/ensaios/[id]/components/EnsaioPhotosClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEnsaioDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any)?.role as Role;
  if (userRole !== Role.ADMIN && userRole !== Role.ARQUITETO) {
    redirect("/signin");
  }

  const { id } = await params;

  // Buscar ensaio
  const ensaio = await prisma.ensaio.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(userRole === Role.ARQUITETO ? {
        createdById: (session.user as any)?.id,
      } : {}),
    },
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
      createdAt: true,
      subject: {
        select: {
          name: true,
          email: true,
          cpf: true,
        },
      },
    },
  });

  if (!ensaio) {
    notFound();
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCpf = (cpf: string | null) => {
    if (!cpf) return "—";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link
          href="/admin/ensaios"
          style={{
            display: "inline-block",
            fontSize: 14,
            color: "#6b7280",
            textDecoration: "none",
            marginBottom: "0.5rem",
          }}
        >
          ← Voltar para Ensaios
        </Link>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: "0.5rem", fontFamily: "var(--font-serif)" }}>
          {ensaio.title}
        </h1>
        {ensaio.description && (
          <p style={{ color: "#6b7280", fontSize: 16 }}>
            {ensaio.description}
          </p>
        )}
      </header>

      {/* Banner informativo para ADMIN */}
      {userRole === Role.ADMIN && (
        <div
          style={{
            padding: "1rem",
            background: "#fef3c7",
            border: "1px solid #fbbf24",
            borderRadius: 8,
            marginBottom: "1.5rem",
            fontSize: 14,
            color: "#92400e",
          }}
        >
          <strong>ℹ️ Modo somente leitura:</strong> Como ADMIN, você pode visualizar este ensaio, 
          mas não pode editá-lo. Para fazer alterações, é necessário estar logado como ARQUITETO.
        </div>
      )}

      {/* Foto de Capa */}
      <div style={{ marginBottom: "2rem" }}>
        <EnsaioCoverClient ensaioId={ensaio.id} title={ensaio.title} />
      </div>

      {/* Informações do Ensaio */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "1.5rem",
          border: "1px solid #e5e7eb",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem" }}>
          Informações do Ensaio
        </h2>
        <div style={{ display: "grid", gap: "1rem", fontSize: 14 }}>
          <div>
            <strong style={{ color: "#6b7280", display: "block", marginBottom: "0.25rem" }}>
              Título
            </strong>
            <span style={{ color: "#111827" }}>{ensaio.title}</span>
          </div>
          <div>
            <strong style={{ color: "#6b7280", display: "block", marginBottom: "0.25rem" }}>
              Modelo
            </strong>
            <span style={{ color: "#111827" }}>
              {ensaio.subject?.name || ensaio.subject?.email || formatCpf(ensaio.subjectCpf)}
            </span>
          </div>
          <div>
            <strong style={{ color: "#6b7280", display: "block", marginBottom: "0.25rem" }}>
              Data do Ensaio
            </strong>
            <span style={{ color: "#111827" }}>{formatDate(ensaio.shootDate)}</span>
          </div>
          <div>
            <strong style={{ color: "#6b7280", display: "block", marginBottom: "0.25rem" }}>
              Status
            </strong>
            <span style={{ color: "#111827" }}>{ensaio.status}</span>
          </div>
        </div>
      </div>

      {/* Galeria do Ensaio */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "1.5rem",
          border: "1px solid #e5e7eb",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: "1rem" }}>
          Galeria do Ensaio
        </h2>
        <EnsaioPhotosClient ensaioId={ensaio.id} />
      </div>
    </div>
  );
}

