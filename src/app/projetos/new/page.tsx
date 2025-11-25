import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CreateProjetoForm from "./components/CreateProjetoForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function CreateProjetoPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/signin");
  }

  const userRole = (session.user as any)?.role;

  if (userRole !== "ARQUITETO") {
    redirect("/signin");
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <p style={{ fontSize: 12, letterSpacing: 1, color: "#9ca3af" }}>
          Gerenciamento de Projetos
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: "0.5rem" }}>
          Criar Novo Projeto
        </h1>
        <p style={{ color: "#6b7280" }}>
          Crie um novo projeto temático para organizar seus ensaios.
        </p>
      </header>

      <CreateProjetoForm />
    </div>
  );
}
