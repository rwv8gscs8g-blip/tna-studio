import { auth } from "@/auth";
import SignOutButton from "../components/SignOutButton";
import Link from "next/link";
import { redirect } from "next/navigation";
import ProfileFormComplete from "./ProfileFormComplete";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/signin");

  const user = session.user;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "3rem 1.5rem",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 15px 35px rgba(0,0,0,0.07)",
          padding: "2.5rem",
        }}
      >
        <header style={{ marginBottom: "2rem" }}>
          <p style={{ textTransform: "uppercase", color: "#9ca3af", fontSize: 12 }}>
            Sessão autenticada
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>
            Meu Perfil
          </h1>
          <p style={{ color: "#6b7280" }}>
            Visualize suas informações e acesse ações rápidas do TNA Studio.
          </p>
        </header>

        <section style={{ display: "grid", gap: "1.5rem" }}>
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "1.5rem",
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>Informações básicas</h2>
            <dl style={{ display: "grid", rowGap: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <dt style={{ color: "#6b7280" }}>Nome</dt>
                <dd>{user?.name ?? "Sem nome cadastrado"}</dd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <dt style={{ color: "#6b7280" }}>Email</dt>
                <dd>{user?.email}</dd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <dt style={{ color: "#6b7280" }}>Perfil</dt>
                <dd style={{ textTransform: "capitalize" }}>
                  {(user as any)?.role?.toLowerCase() ?? "modelo"}
                </dd>
              </div>
            </dl>
          </div>

          <ProfileFormComplete />

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "1.5rem",
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>Próximas etapas</h2>
            <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
              Links rápidos usados durante a homologação do MVP.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <Link
                href="/"
                style={{
                  padding: "0.75rem 1.25rem",
                  borderRadius: 10,
                  background: "#111827",
                  color: "#fff",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Voltar à Home
              </Link>
              {(user as any)?.role === "ADMIN" && (
                <Link
                  href="/admin/users"
                  style={{
                    padding: "0.75rem 1.25rem",
                    borderRadius: 10,
                    background: "#2563eb",
                    color: "#fff",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Painel Admin
                </Link>
              )}
              <SignOutButton variant="ghost" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

