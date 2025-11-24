"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

interface ViewModelModalProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    cpf: string | null;
    birthDate: string | null;
    role: string;
    createdAt: Date;
  };
  age: number | null;
  onClose: () => void;
  onEdit?: (userId: string) => void;
}

export default function ViewModelModal({ user, age, onClose, onEdit }: ViewModelModalProps) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const canEdit = userRole === "ARQUITETO";

  // Fechar ao pressionar ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

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

  // Formatar data de criação
  const formatCreatedAt = (date: Date): string => {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  // Obter label do role
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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: 12,
          maxWidth: 600,
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Dados da Modelo</h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: "#6b7280",
              padding: 0,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Fechar modal"
          >
            ×
          </button>
        </div>
        <div style={{ display: "grid", gap: "1rem" }}>
          <div>
            <strong>Nome:</strong> {user.name || "—"}
          </div>
          <div>
            <strong>Email:</strong> {user.email}
          </div>
          <div>
            <strong>CPF:</strong> {formatCpf(user.cpf)}
          </div>
          <div>
            <strong>Data de Nascimento:</strong> {formatBirthDate(user.birthDate)}
          </div>
          <div>
            <strong>Idade:</strong> {age !== null ? `${age} anos` : "—"}
          </div>
          <div>
            <strong>Perfil:</strong> {getRoleLabel(user.role)}
          </div>
          <div>
            <strong>Criado em:</strong> {formatCreatedAt(user.createdAt)}
          </div>
        </div>
        {canEdit && onEdit && (
          <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <button
              onClick={() => {
                onClose();
                onEdit(user.id);
              }}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#059669",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Editar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

