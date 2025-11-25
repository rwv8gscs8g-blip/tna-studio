import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import EnsaiosListModeloClient from "./components/EnsaiosListModeloClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ModeloEnsaiosPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/signin");
  }

  // Proteção: apenas MODELO pode acessar
  const userRole = (session.user as any)?.role;
  if (userRole !== "MODELO") {
    redirect("/signin");
  }

  const userId = (session.user as any)?.id;

  // Buscar CPF da MODELO logada
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { cpf: true, name: true },
  });

  if (!user || !user.cpf) {
    redirect("/signin");
  }

  // Buscar ensaios associados ao CPF da MODELO (status PUBLISHED)
  const ensaios = await prisma.ensaio.findMany({
    where: {
      subjectCpf: user.cpf,
      status: "PUBLISHED", // Apenas ensaios publicados
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      shootDate: true,
      status: true,
      coverImageKey: true,
      termPdfKey: true,
      createdAt: true,
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: [
      { shootDate: "desc" }, // Mais recentes primeiro (por data do ensaio)
      { createdAt: "desc" }, // Fallback: por data de criação
    ],
  });

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <p style={{ fontSize: 12, letterSpacing: 1, color: "#9ca3af" }}>
            Meus ensaios
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Ensaios Fotográficos</h1>
          <p style={{ color: "#6b7280" }}>
            Ensaios publicados associados ao seu cadastro
          </p>
        </div>
        <Link
          href="/modelo/profile"
          style={{
            textDecoration: "none",
            padding: "0.65rem 1.25rem",
            background: "#111827",
            color: "#fff",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Meu Perfil
        </Link>
      </header>

      {/* Listagem em grid 3 colunas (somente leitura para MODELO) */}
      <EnsaiosListModeloClient ensaios={ensaios} />
    </div>
  );
}
