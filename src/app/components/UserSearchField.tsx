/**
 * Componente reutilizável para buscar e selecionar usuários (MODELO ou CLIENTE)
 * Busca por nome, email ou CPF
 */

"use client";

import { useState, useEffect, useRef } from "react";

export interface User {
  id: string;
  name: string | null;
  email: string;
  cpf: string | null;
  role: string;
}

interface UserSearchFieldProps {
  value: User | null;
  onChange: (user: User | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  roleFilter?: "MODELO" | "CLIENTE"; // Filtrar por role específico
}

export default function UserSearchField({
  value,
  onChange,
  label = "Modelo ou Cliente",
  placeholder = "Buscar por nome, email ou CPF...",
  required = false,
  disabled = false,
  roleFilter,
}: UserSearchFieldProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Atualizar searchTerm quando value mudar externamente
  useEffect(() => {
    if (value) {
      const displayText = value.name 
        ? `${value.name} (${value.email})`
        : value.email;
      setSearchTerm(displayText);
    } else {
      setSearchTerm("");
    }
  }, [value]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  // Buscar usuários enquanto digita
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Se o termo atual corresponde ao usuário selecionado, não buscar
    if (value && searchTerm === (value.name ? `${value.name} (${value.email})` : value.email)) {
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: searchTerm });
        if (roleFilter) {
          params.append("role", roleFilter);
        }
        const res = await fetch(`/api/arquiteto/users/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.users || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("[UserSearchField] Erro ao buscar usuários:", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(searchTimeout);
  }, [searchTerm, roleFilter, value]);

  const handleSelectUser = (user: User) => {
    onChange(user);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchTerm("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Formatar CPF para exibição
  const formatCpf = (cpf: string | null) => {
    if (!cpf) return "";
    if (cpf.length === 11) {
      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return cpf;
  };

  return (
    <div ref={searchRef} style={{ position: "relative" }}>
      <label style={{ display: "grid", gap: "0.5rem" }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>
          {label} {required && "*"}
        </span>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (value) {
                // Se havia um usuário selecionado e o usuário está editando, limpar seleção
                onChange(null);
              }
            }}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 14,
              paddingRight: value ? "2.5rem" : "0.75rem",
            }}
          />
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#6b7280",
                fontSize: 18,
                padding: "0.25rem",
                lineHeight: 1,
              }}
              title="Limpar seleção"
            >
              ×
            </button>
          )}
        </div>
        {value && (
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Selecionado: {value.name || value.email} {value.cpf && `(${formatCpf(value.cpf)})`}
          </div>
        )}
      </label>

      {/* Dropdown de sugestões */}
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "0.25rem",
            background: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 1000,
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {loading ? (
            <div style={{ padding: "1rem", textAlign: "center", color: "#6b7280" }}>
              Buscando...
            </div>
          ) : suggestions.length === 0 ? (
            <div style={{ padding: "1rem", textAlign: "center", color: "#6b7280" }}>
              Nenhum usuário encontrado
            </div>
          ) : (
            suggestions.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelectUser(user)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid #f3f4f6",
                  cursor: "pointer",
                  fontSize: 14,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{ fontWeight: 500, color: "#111827", marginBottom: "0.25rem" }}>
                  {user.name || user.email}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {user.name && <span>{user.email}</span>}
                  {user.cpf && (
                    <span style={{ marginLeft: "0.5rem" }}>
                      CPF: {formatCpf(user.cpf)}
                    </span>
                  )}
                  <span style={{ marginLeft: "0.5rem", textTransform: "capitalize" }}>
                    ({user.role.toLowerCase()})
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

