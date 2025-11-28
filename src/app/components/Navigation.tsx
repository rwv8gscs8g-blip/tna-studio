"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import SignOutButton from "./SignOutButton";
import SessionTimer from "./SessionTimer";
import NavLink from "@/components/ui/NavLink";

export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Se está carregando, não mostra nada
  if (status === "loading") {
    return null;
  }

  // Se não há sessão, não mostra navegação
  if (!session?.user) {
    return null;
  }

  const userRole = (session.user as any)?.role;

  // Função para verificar se um link está ativo
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };
  
  // Flags para controlar acesso às áreas administrativas
  // ADMIN, ARQUITETO e SUPERADMIN podem ver as telas de admin
  const canSeeAdmin = userRole === "ADMIN" || userRole === "ARQUITETO" || userRole === "SUPERADMIN";
  // Apenas ARQUITETO pode editar (ADMIN e SUPERADMIN são somente leitura)
  const canEditAdmin = userRole === "ARQUITETO";

  // Função para exibir o papel do usuário de forma amigável
  const getRoleLabel = (role: string): string => {
    const roleMap: Record<string, string> = {
      ARQUITETO: "Arquiteto",
      ADMIN: "Admin",
      MODELO: "Modelo",
      CLIENTE: "Cliente",
      SUPERADMIN: "Super Admin",
    };
    return roleMap[role] || role.toLowerCase();
  };

  return (
    <nav
      style={{
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        padding: "1rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <Link
          href={
            userRole === "ARQUITETO"
              ? "/arquiteto/home"
              : userRole === "ADMIN"
              ? "/admin/reports"
              : userRole === "MODELO"
              ? "/modelo/home"
              : userRole === "CLIENTE"
              ? "/cliente/home"
              : "/"
          }
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#111827",
            textDecoration: "none",
          }}
        >
          TNA Studio
        </Link>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {/* Links por role */}
          {userRole === "ARQUITETO" && (
            <>
              <NavLink href="/arquiteto/home">Home</NavLink>
              <NavLink href="/arquiteto/ensaios">Ensaios</NavLink>
              <NavLink href="/arquiteto/ensaios/new">Criar Ensaio</NavLink>
              <NavLink href="/arquiteto/produtos">Produtos</NavLink>
              <NavLink href="/loja">Loja</NavLink>
            </>
          )}
          {userRole === "MODELO" && (
            <>
              <NavLink href="/modelo/home">Home</NavLink>
              <NavLink href="/modelo/ensaios">Meus Ensaios</NavLink>
              <NavLink href="/loja">Loja</NavLink>
              <NavLink href="/projetos">Projetos</NavLink>
            </>
          )}
          {userRole === "CLIENTE" && (
            <>
              <NavLink href="/cliente/home">Home</NavLink>
            </>
          )}
          {userRole === "SUPERADMIN" && (
            <Link
              href="/super-admin/certificates"
              style={{
                color: "#6b7280",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                padding: "0.5rem 1rem",
                borderRadius: 6,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f9fafb";
                e.currentTarget.style.color = "#111827";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#6b7280";
              }}
            >
              Certificados A1
            </Link>
          )}
          <NavLink href="/profile">Perfil</NavLink>
          {/* Links de Admin/Relatórios: ADMIN e ARQUITETO podem ver */}
          {canSeeAdmin && (
            <>
              <NavLink href="/admin/ensaios">Ensaios</NavLink>
              <NavLink href="/admin/users">Gerenciar usuários</NavLink>
              <NavLink href="/admin/reports">Relatórios</NavLink>
              <NavLink href="/projetos">Projetos</NavLink>
            </>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <SessionTimer />
        <div style={{ fontSize: 14, color: "#6b7280" }}>
          Logado como: <strong style={{ color: "#111827" }}>{session.user?.name || session.user?.email}</strong>
          {userRole && (
            <span style={{ marginLeft: "0.5rem", color: "#9ca3af" }}>
              ({getRoleLabel(userRole)})
            </span>
          )}
        </div>
        <SignOutButton variant="ghost" />
      </div>
    </nav>
  );
}

