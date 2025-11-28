"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ViewModelModal from "./components/ViewModelModal";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  cpf: string | null;
  birthDate: string | null;
  createdAt: Date;
  profileImage: string | null;
}

interface ReportsData {
  users: User[];
  totalUsers: number;
  arquitetoCount: number;
  adminCount: number;
  modeloCount: number;
  clienteCount: number;
  superAdminCount: number;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedModelo, setSelectedModelo] = useState<User | null>(null);
  const [counts, setCounts] = useState({
    totalUsers: 0,
    arquitetoCount: 0,
    adminCount: 0,
    modeloCount: 0,
    clienteCount: 0,
    superAdminCount: 0,
  });

  // Verificar autenticação
  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated" || !session?.user) {
      router.push("/signin");
      return;
    }
    
    const userRole = (session.user as any).role;
    const canSeeAdmin = userRole === "ADMIN" || userRole === "ARQUITETO" || userRole === "SUPERADMIN";
    
    if (!canSeeAdmin) {
      router.push("/");
      return;
    }
  }, [status, session, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/admin/reports", {
          credentials: "include",
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.push("/signin");
            return;
          }
          throw new Error("Erro ao carregar dados");
        }
        const data: ReportsData = await res.json();
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
        setCounts({
          totalUsers: data.totalUsers || 0,
          arquitetoCount: data.arquitetoCount || 0,
          adminCount: data.adminCount || 0,
          modeloCount: data.modeloCount || 0,
          clienteCount: data.clienteCount || 0,
          superAdminCount: data.superAdminCount || 0,
        });
      } catch (error) {
        console.error("Erro ao carregar relatórios:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  useEffect(() => {
    let filtered = users;

    // Filtro por busca (nome, email, CPF)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.cpf?.includes(term)
      );
    }

    // Filtro por role
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  if (loading) {
    return (
      <div style={{ padding: "2.5rem 2rem", textAlign: "center" }}>
        <p>Carregando...</p>
      </div>
    );
  }

  // Mapear role para string amigável
  const getRoleLabel = (role: string): string => {
    const roleMap: Record<string, string> = {
      ARQUITETO: "Arquiteto",
      ADMIN: "Admin",
      MODELO: "Modelo",
      CLIENTE: "Cliente",
      SUPERADMIN: "Superadmin",
    };
    return roleMap[role] || role.toLowerCase();
  };

  const cards = [
    { label: "Total de usuários", value: counts.totalUsers },
    { label: "Arquitetos", value: counts.arquitetoCount },
    { label: "Administradores", value: counts.adminCount },
    { label: "Modelos", value: counts.modeloCount },
    { label: "Clientes", value: counts.clienteCount },
    { label: "Super Admins", value: counts.superAdminCount },
  ];

  // Verificar se ARQUITETO está em modo somente leitura
  const isReadOnlyArquiteto = (session as any)?.isReadOnlyArquiteto === true;

  return (
    <div style={{ padding: "2.5rem 2rem", background: "#f9fafb", minHeight: "100vh" }}>
      {isReadOnlyArquiteto && (
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
          <strong>⚠️ Modo somente leitura:</strong> Você está em modo somente leitura porque existe outra sessão ativa do Arquiteto. Para retomar os poderes de edição, faça login novamente neste dispositivo.
        </div>
      )}
      <header style={{ marginBottom: "2rem" }}>
        <p style={{ color: "#9ca3af", textTransform: "uppercase", fontSize: 12 }}>
          Monitoramento interno
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 700 }}>Relatórios do TNA Studio</h1>
        <p style={{ color: "#6b7280" }}>
          Visão rápida da base de usuários e últimos cadastros da instância atual.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        {cards.map((card) => (
          <div
            key={card.label}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "1.25rem",
              boxShadow: "0 5px 20px rgba(15,23,42,0.05)",
            }}
          >
            <p style={{ color: "#6b7280", fontSize: 14 }}>{card.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700 }}>{card.value}</p>
          </div>
        ))}
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "1.5rem",
          boxShadow: "0 8px 30px rgba(15,23,42,0.08)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>Últimos cadastros</h2>
            <p style={{ color: "#6b7280", fontSize: 14 }}>
              Últimos 30 usuários criados no banco `tna_studio`.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Buscar por nome, email, CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 14,
            }}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: "0.75rem",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 14,
            }}
          >
            <option value="all">Todos os perfis</option>
            <option value="ARQUITETO">Arquitetos</option>
            <option value="ADMIN">Administradores</option>
            <option value="SUPERADMIN">Superadmin</option>
            <option value="MODELO">Modelos</option>
            <option value="CLIENTE">Clientes</option>
          </select>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "0.75rem" }}>Avatar</th>
                <th style={{ padding: "0.75rem" }}>Nome</th>
                <th style={{ padding: "0.75rem" }}>Email</th>
                <th style={{ padding: "0.75rem" }}>CPF</th>
                <th style={{ padding: "0.75rem" }}>Perfil</th>
                <th style={{ padding: "0.75rem" }}>Nascimento</th>
                <th style={{ padding: "0.75rem" }}>Idade</th>
                <th style={{ padding: "0.75rem" }}>Criado em</th>
                <th style={{ padding: "0.75rem" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const age = user.birthDate
                    ? (() => {
                        const birth = new Date(user.birthDate);
                        const today = new Date();
                        let a = today.getFullYear() - birth.getFullYear();
                        const monthDiff = today.getMonth() - birth.getMonth();
                        if (
                          monthDiff < 0 ||
                          (monthDiff === 0 && today.getDate() < birth.getDate())
                        ) {
                          a--;
                        }
                        return a;
                      })()
                    : null;
                  // Formatar CPF
                  const formatCpf = (cpf: string | null): string => {
                    if (!cpf) return "—";
                    if (cpf.length === 11) {
                      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
                    }
                    return cpf;
                  };

                  // Formatar data de nascimento
                  const formatBirthDate = (date: string | null): string => {
                    if (!date) return "—";
                    return new Intl.DateTimeFormat("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }).format(new Date(date));
                  };

                  const avatarUrl = user.profileImage || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='16' fill='%236b7280'%3E${(user.name || user.email).charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;

                  return (
                    <tr key={user.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "0.75rem" }}>
                        <img
                          src={avatarUrl}
                          alt={user.name || "Usuário"}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "1px solid #e5e7eb",
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='16' fill='%236b7280'%3E${(user.name || user.email).charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
                          }}
                        />
                      </td>
                      <td style={{ padding: "0.75rem" }}>{user.name || "—"}</td>
                      <td style={{ padding: "0.75rem" }}>{user.email}</td>
                      <td style={{ padding: "0.75rem" }}>{formatCpf(user.cpf)}</td>
                      <td style={{ padding: "0.75rem" }}>
                        {getRoleLabel(user.role)}
                      </td>
                      <td style={{ padding: "0.75rem" }}>{formatBirthDate(user.birthDate)}</td>
                      <td style={{ padding: "0.75rem" }}>{age !== null ? `${age} anos` : "—"}</td>
                      <td style={{ padding: "0.75rem", color: "#6b7280" }}>
                        {new Intl.DateTimeFormat("pt-BR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(user.createdAt))}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {user.role === "MODELO" && (
                          <button
                            onClick={() => setSelectedModelo(user)}
                            style={{
                              padding: "0.5rem 1rem",
                              background: "#111827",
                              color: "#fff",
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontSize: 14,
                              fontWeight: 500,
                            }}
                          >
                            Ver modelo
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedModelo && (
        <ViewModelModal
          user={selectedModelo}
          onClose={() => setSelectedModelo(null)}
        />
      )}
    </div>
  );
}
