import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role, EnsaioStatus } from "@prisma/client";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AvisosPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any)?.role as Role;
  const userId = (session.user as any)?.id;

  // Apenas ARQUITETO e ADMIN podem acessar
  if (userRole !== "ARQUITETO" && userRole !== "ADMIN") {
    redirect("/");
  }

  const isArquiteto = userRole === "ARQUITETO";

  // Buscar avisos específicos por role
  const avisos: Array<{
    tipo: string;
    titulo: string;
    mensagem: string;
    prioridade: "alta" | "media" | "baixa";
    link?: string;
    count?: number;
  }> = [];

  if (isArquiteto) {
    // Solicitações de alteração pendentes
    let solicitacoesPendentes = 0;
    try {
      solicitacoesPendentes = await prisma.modelChangeRequest.count({
        where: { status: "PENDING" },
      });
    } catch (err) {
      console.warn("[Avisos] Erro ao contar solicitações:", err);
    }

    if (solicitacoesPendentes > 0) {
      avisos.push({
        tipo: "solicitacoes",
        titulo: "Solicitações de Alteração Pendentes",
        mensagem: `Há ${solicitacoesPendentes} solicitação(ões) de alteração de dados aguardando sua aprovação.`,
        prioridade: "alta",
        link: "/arquiteto/solicitacoes",
        count: solicitacoesPendentes,
      });
    }

    // Ensaios deletados há mais de 7 dias
    let ensaiosDeletados = 0;
    try {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

      ensaiosDeletados = await prisma.ensaio.count({
        where: {
          createdById: userId,
          status: EnsaioStatus.DELETED,
          updatedAt: {
            lte: seteDiasAtras,
          },
        },
      });
    } catch (err: any) {
      console.error("[Avisos] Erro ao contar ensaios deletados:", err);
      // Continua sem adicionar aviso se houver erro
    }

    if (ensaiosDeletados > 0) {
      avisos.push({
        tipo: "ensaios_deletados",
        titulo: "Ensaios Deletados há Mais de 7 Dias",
        mensagem: `Há ${ensaiosDeletados} ensaio(s) marcado(s) como deletado(s) há mais de 7 dias. Considere limpar esses registros.`,
        prioridade: "media",
        link: `/arquiteto/ensaios?status=${EnsaioStatus.DELETED}`,
        count: ensaiosDeletados,
      });
    }
  }

  // Avisos para ADMIN (somente leitura)
  if (userRole === "ADMIN") {
    let ensaiosDeletados = 0;
    try {
      ensaiosDeletados = await prisma.ensaio.count({
        where: {
          status: EnsaioStatus.DELETED,
        },
      });
    } catch (err: any) {
      console.error("[Avisos] Erro ao contar ensaios deletados (ADMIN):", err);
      // Continua sem adicionar aviso se houver erro
    }

    if (ensaiosDeletados > 0) {
      avisos.push({
        tipo: "ensaios_deletados",
        titulo: "Ensaios Deletados no Sistema",
        mensagem: `Há ${ensaiosDeletados} ensaio(s) marcado(s) como deletado(s) no sistema.`,
        prioridade: "baixa",
      });
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: "0.5rem" }}>
          Avisos do Sistema
        </h1>
        <p style={{ color: "#6b7280" }}>
          {isArquiteto
            ? "Avisos e notificações sobre o sistema que requerem sua atenção."
            : "Avisos e notificações sobre o sistema (somente leitura)."}
        </p>
      </header>

      {avisos.length === 0 ? (
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
            Nenhum aviso no momento. Tudo está em ordem! ✅
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {avisos.map((aviso, index) => (
            <div
              key={index}
              style={{
                background: "#fff",
                borderRadius: 12,
                border: `2px solid ${
                  aviso.prioridade === "alta"
                    ? "#dc2626"
                    : aviso.prioridade === "media"
                    ? "#f59e0b"
                    : "#6b7280"
                }`,
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                  {aviso.titulo}
                </h3>
                {aviso.count !== undefined && (
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      background:
                        aviso.prioridade === "alta"
                          ? "#fee2e2"
                          : aviso.prioridade === "media"
                          ? "#fef3c7"
                          : "#f3f4f6",
                      color:
                        aviso.prioridade === "alta"
                          ? "#991b1b"
                          : aviso.prioridade === "media"
                          ? "#92400e"
                          : "#6b7280",
                    }}
                  >
                    {aviso.count}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 14, color: "#6b7280", marginBottom: "0.75rem" }}>
                {aviso.mensagem}
              </p>
              {aviso.link && isArquiteto && (
                <Link
                  href={aviso.link}
                  style={{
                    display: "inline-block",
                    padding: "0.5rem 1rem",
                    background: "#111827",
                    color: "#fff",
                    borderRadius: 6,
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Ver Detalhes →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

