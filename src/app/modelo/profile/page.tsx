import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ModeloProfilePage() {
  const session = await auth();

  // Proteção: apenas MODELO pode acessar
  if (!session || (session.user as any)?.role !== "MODELO") {
    redirect("/signin");
  }

  const userId = (session.user as any)?.id;
  const userEmail = session.user?.email || "";

  // Buscar dados completos do usuário MODELO
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      phone: true,
      birthDate: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/signin");
  }

  // Calcular idade
  const age = user.birthDate
    ? (() => {
        const birth = new Date(user.birthDate);
        const today = new Date();
        let a = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          a--;
        }
        return a;
      })()
    : null;

  // Formatar CPF para exibição
  const formatCpf = (cpf: string | null) => {
    if (!cpf) return "—";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
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
            Meu perfil
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Dados Pessoais</h1>
          <p style={{ color: "#6b7280" }}>
            Seus dados cadastrais (somente leitura)
          </p>
        </div>
        <Link
          href="/modelo/ensaios"
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
          Ver Ensaios
        </Link>
      </header>

      {/* Mensagem informativa */}
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
        <strong>ℹ️ Informação:</strong> Seus dados pessoais foram cadastrados e só podem ser atualizados pelo Arquiteto responsável pelo ensaio. Alteração de senha disponível em breve.
      </div>

      {/* Dados pessoais - somente leitura */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          padding: "2rem",
        }}
      >
        <div style={{ display: "grid", gap: "1.5rem" }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Nome completo
            </label>
            <div
              style={{
                marginTop: "0.5rem",
                padding: "0.75rem",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 16,
                color: "#111827",
              }}
            >
              {user.name || "—"}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
              E-mail
            </label>
            <div
              style={{
                marginTop: "0.5rem",
                padding: "0.75rem",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 16,
                color: "#111827",
              }}
            >
              {user.email}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
                CPF
              </label>
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.75rem",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 16,
                  color: "#111827",
                }}
              >
                {formatCpf(user.cpf)}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Telefone
              </label>
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.75rem",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 16,
                  color: "#111827",
                }}
              >
                {user.phone || "—"}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Data de nascimento
              </label>
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.75rem",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 16,
                  color: "#111827",
                }}
              >
                {user.birthDate
                  ? new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "long",
                    }).format(new Date(user.birthDate))
                  : "—"}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Idade
              </label>
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.75rem",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 16,
                  color: "#111827",
                }}
              >
                {age ? `${age} anos` : "—"}
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Conta criada em
            </label>
            <div
              style={{
                marginTop: "0.5rem",
                padding: "0.75rem",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: 16,
                color: "#111827",
              }}
            >
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "long",
                timeStyle: "short",
              }).format(user.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

