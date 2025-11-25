import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateEnsaioForm from "../components/CreateEnsaioForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NewEnsaioPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any)?.role;
  
  // Proteção: apenas ARQUITETO pode criar ensaios
  if (userRole !== "ARQUITETO") {
    redirect("/signin");
  }

  const userId = (session.user as any)?.id;
  
  // Verificar se está em modo somente leitura
  const isReadOnlyArquiteto = (session as any)?.isReadOnlyArquiteto === true;
  if (isReadOnlyArquiteto) {
    redirect("/arquiteto/ensaios");
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link
          href="/arquiteto/ensaios"
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
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: "0.5rem" }}>
          Criar Novo Ensaio
        </h1>
        <p style={{ color: "#6b7280" }}>
          Preencha os dados do ensaio fotográfico abaixo.
        </p>
      </header>

      <CreateEnsaioForm userId={userId} />
    </div>
  );
}

