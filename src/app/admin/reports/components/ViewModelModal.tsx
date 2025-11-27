"use client";

import { useEffect } from "react";

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

interface ViewModelModalProps {
  user: User;
  onClose: () => void;
}

export default function ViewModelModal({ user, onClose }: ViewModelModalProps) {
  // Fechar modal ao pressionar ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const formatCpf = (cpf: string | null): string => {
    if (!cpf) return "—";
    if (cpf.length === 11) {
      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return cpf;
  };

  const formatBirthDate = (date: string | null): string => {
    if (!date) return "—";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  };

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

  const avatarUrl = user.profileImage || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='60' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='%236b7280'%3E${(user.name || user.email).charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;

  return (
    <div
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
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
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
        onClick={(e) => e.stopPropagation()}
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
              padding: "0.25rem 0.5rem",
              lineHeight: 1,
            }}
            aria-label="Fechar modal"
          >
            ×
          </button>
        </div>
        <div style={{ display: "grid", gap: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <img
              src={avatarUrl}
              alt="Foto da modelo"
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #e5e7eb",
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='60' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='%236b7280'%3E${(user.name || user.email).charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
              }}
            />
          </div>
          <div style={{ display: "grid", gap: "0.75rem" }}>
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
              <strong>Criado em:</strong>{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(user.createdAt))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
