"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import SignOutButton from "./SignOutButton";
import SessionTimer from "./SessionTimer";

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

  // Função para obter estilo do link baseado no estado ativo
  const getLinkStyle = (href: string, isButton = false) => {
    const active = isActive(href);
    if (isButton) {
      return {
        color: "#fff",
        background: "#111827",
        textDecoration: "none",
        fontSize: 14,
        fontWeight: 500,
        padding: "0.5rem 1rem",
        borderRadius: 6,
        transition: "all 0.2s",
      };
    }
    return {
      color: active ? "#6b7280" : "#6b7280", // Cinza médio quando ativo
      textDecoration: "none",
      fontSize: 14,
      fontWeight: active ? 600 : 500,
      padding: "0.5rem 1rem",
      borderRadius: 6,
      transition: "all 0.2s",
      background: active ? "#f3f4f6" : "transparent", // Fundo cinza claro quando ativo
    };
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
              <Link
                href="/arquiteto/home"
                style={getLinkStyle("/arquiteto/home")}
                onMouseEnter={(e) => {
                  if (!isActive("/arquiteto/home")) {
                    e.currentTarget.style.background = "#f9fafb";
                    e.currentTarget.style.color = "#111827";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/arquiteto/home")) {
                    e.currentTarget.style.background = isActive("/arquiteto/home") ? "#f3f4f6" : "transparent";
                    e.currentTarget.style.color = "#6b7280";
                  }
                }}
              >
                Home
              </Link>
              <Link
                href="/arquiteto/ensaios"
                style={getLinkStyle("/arquiteto/ensaios")}
                onMouseEnter={(e) => {
                  if (!isActive("/arquiteto/ensaios")) {
                    e.currentTarget.style.background = "#f9fafb";
                    e.currentTarget.style.color = "#111827";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/arquiteto/ensaios")) {
                    e.currentTarget.style.background = isActive("/arquiteto/ensaios") ? "#f3f4f6" : "transparent";
                    e.currentTarget.style.color = "#6b7280";
                  }
                }}
              >
                Ensaios
              </Link>
              <Link
                href="/arquiteto/ensaios/new"
                style={getLinkStyle("/arquiteto/ensaios/new", true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#374151";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#111827";
                }}
              >
                Criar Ensaio
              </Link>
              <Link
                href="/loja"
                style={getLinkStyle("/loja")}
                onMouseEnter={(e) => {
                  if (!isActive("/loja")) {
                    e.currentTarget.style.background = "#f9fafb";
                    e.currentTarget.style.color = "#111827";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/loja")) {
                    e.currentTarget.style.background = isActive("/loja") ? "#f3f4f6" : "transparent";
                    e.currentTarget.style.color = "#6b7280";
                  }
                }}
              >
                Loja
              </Link>
            </>
          )}
          {userRole === "MODELO" && (
            <>
              <Link
                href="/modelo/home"
                style={getLinkStyle("/modelo/home")}
                onMouseEnter={(e) => {
                  if (!isActive("/modelo/home")) {
                    e.currentTarget.style.background = "#f9fafb";
                    e.currentTarget.style.color = "#111827";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/modelo/home")) {
                    e.currentTarget.style.background = isActive("/modelo/home") ? "#f3f4f6" : "transparent";
                    e.currentTarget.style.color = "#6b7280";
                  }
                }}
              >
                Home
              </Link>
              <Link
                href="/modelo/ensaios"
                style={getLinkStyle("/modelo/ensaios")}
                onMouseEnter={(e) => {
                  if (!isActive("/modelo/ensaios")) {
                    e.currentTarget.style.background = "#f9fafb";
                    e.currentTarget.style.color = "#111827";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/modelo/ensaios")) {
                    e.currentTarget.style.background = isActive("/modelo/ensaios") ? "#f3f4f6" : "transparent";
                    e.currentTarget.style.color = "#6b7280";
                  }
                }}
              >
                Meus Ensaios
              </Link>
              <Link
                href="/loja"
                style={getLinkStyle("/loja")}
                onMouseEnter={(e) => {
                  if (!isActive("/loja")) {
                    e.currentTarget.style.background = "#f9fafb";
                    e.currentTarget.style.color = "#111827";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/loja")) {
                    e.currentTarget.style.background = isActive("/loja") ? "#f3f4f6" : "transparent";
                    e.currentTarget.style.color = "#6b7280";
                  }
                }}
              >
                Loja
              </Link>
              <Link
                href="/projetos"
                style={getLinkStyle("/projetos")}
                onMouseEnter={(e) => {
                  if (!isActive("/projetos")) {
                    e.currentTarget.style.background = "#f9fafb";
                    e.currentTarget.style.color = "#111827";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/projetos")) {
                    e.currentTarget.style.background = isActive("/projetos") ? "#f3f4f6" : "transparent";
                    e.currentTarget.style.color = "#6b7280";
                  }
                }}
              >
                Projetos
              </Link>
            </>
          )}
          {userRole === "CLIENTE" && (
            <>
              <Link
                href="/cliente/home"
                style={getLinkStyle("/cliente/home")}
                onMouseEnter={(e) => {
                  if (!isActive("/cliente/home")) {
                    e.currentTarget.style.background = "#f9fafb";
                    e.currentTarget.style.color = "#111827";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/cliente/home")) {
                    e.currentTarget.style.background = isActive("/cliente/home") ? "#f3f4f6" : "transparent";
                    e.currentTarget.style.color = "#6b7280";
                  }
                }}
              >
                Home
              </Link>
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
          <Link
            href="/profile"
            style={getLinkStyle("/profile")}
            onMouseEnter={(e) => {
              if (!isActive("/profile")) {
                e.currentTarget.style.background = "#f9fafb";
                e.currentTarget.style.color = "#111827";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive("/profile")) {
                e.currentTarget.style.background = isActive("/profile") ? "#f3f4f6" : "transparent";
                e.currentTarget.style.color = "#6b7280";
              }
            }}
          >
            Perfil
          </Link>
          {/* Links de Admin/Relatórios: ADMIN e ARQUITETO podem ver */}
          {canSeeAdmin && (
            <>
              {userRole === "ADMIN" && (
                <Link
                  href="/admin/reports"
                  style={getLinkStyle("/admin/reports")}
                  onMouseEnter={(e) => {
                    if (!isActive("/admin/reports")) {
                      e.currentTarget.style.background = "#f9fafb";
                      e.currentTarget.style.color = "#111827";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive("/admin/reports")) {
                      e.currentTarget.style.background = isActive("/admin/reports") ? "#f3f4f6" : "transparent";
                      e.currentTarget.style.color = "#6b7280";
                    }
                  }}
                >
                  Ensaios
                </Link>
              )}
              <Link
                href="/admin/users"
                style={getLinkStyle("/admin/users")}
                onMouseEnter={(e) => {
                  if (!isActive("/admin/users")) {
                    e.currentTarget.style.background = "#f9fafb";
                    e.currentTarget.style.color = "#111827";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/admin/users")) {
                    e.currentTarget.style.background = isActive("/admin/users") ? "#f3f4f6" : "transparent";
                    e.currentTarget.style.color = "#6b7280";
                  }
                }}
              >
                Gerenciar usuários
              </Link>
              <Link
                href="/admin/reports"
                style={getLinkStyle("/admin/reports")}
                onMouseEnter={(e) => {
                  if (!isActive("/admin/reports")) {
                    e.currentTarget.style.background = "#f9fafb";
                    e.currentTarget.style.color = "#111827";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/admin/reports")) {
                    e.currentTarget.style.background = isActive("/admin/reports") ? "#f3f4f6" : "transparent";
                    e.currentTarget.style.color = "#6b7280";
                  }
                }}
              >
                Relatórios
              </Link>
              <Link
                href="/projetos"
                style={getLinkStyle("/projetos")}
                onMouseEnter={(e) => {
                  if (!isActive("/projetos")) {
                    e.currentTarget.style.background = "#f9fafb";
                    e.currentTarget.style.color = "#111827";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/projetos")) {
                    e.currentTarget.style.background = isActive("/projetos") ? "#f3f4f6" : "transparent";
                    e.currentTarget.style.color = "#6b7280";
                  }
                }}
              >
                Projetos
              </Link>
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

