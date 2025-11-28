"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatCpf, parseCpf } from "@/lib/formatters";

type Props = {
  roles: string[];
};

export default function CreateUserForm({ roles }: Props) {
  const router = useRouter();
  // Define MODELO como padrão (primeiro na lista)
  const defaultRole = roles.find(r => r === "MODELO") || roles[0] || "MODELO";
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    role: defaultRole,
    cpf: "",
    phone: "",
    birthDate: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  async function handleProfileImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tamanho (3 MB)
    if (file.size > 3 * 1024 * 1024) {
      setError("A foto de perfil deve ter no máximo 3 MB.");
      return;
    }

    // Validação de tipo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/webp", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("A foto de perfil deve ser JPG, PNG ou WebP.");
      return;
    }

    setProfileImageFile(file);
    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Primeiro criar o usuário
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...form,
        cpf: parseCpf(form.cpf), // Garantir que CPF está sem formatação
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao criar usuário.");
      setLoading(false);
      return;
    }

    const data = await res.json();
    const newUserId = data.user?.id;

    // Se temos foto, fazer upload depois de criar o usuário
    if (profileImageFile && newUserId) {
      setUploadingImage(true);
      try {
        const formData = new FormData();
        formData.append("file", profileImageFile);
        formData.append("userId", newUserId);

        const uploadRes = await fetch("/api/admin/users/upload-profile-image", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json().catch(() => ({}));
          setError(uploadData.error ?? "Usuário criado, mas erro ao fazer upload da foto de perfil.");
          setLoading(false);
          setUploadingImage(false);
          return;
        }

        const uploadData = await uploadRes.json();
        // Atualizar o usuário com a URL da foto
        const updateRes = await fetch(`/api/admin/users/${newUserId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ profileImage: uploadData.url }),
        });

        if (!updateRes.ok) {
          setError("Usuário criado, mas erro ao salvar foto de perfil.");
          setLoading(false);
          setUploadingImage(false);
          return;
        }
      } catch (err: any) {
        setError("Usuário criado, mas erro ao fazer upload da foto de perfil.");
        setLoading(false);
        setUploadingImage(false);
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    setLoading(false);
    setForm({ name: "", email: "", password: "", role: form.role, cpf: "", phone: "", birthDate: "" });
    setProfileImageFile(null);
    setProfileImagePreview(null);
    setSuccess("Usuário criado com sucesso.");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "grid",
        gap: "0.85rem",
        background: "#fff",
        borderRadius: 12,
        padding: "1.25rem",
        border: "1px solid #e5e7eb",
      }}
    >
      <div>
        <label style={{ fontSize: 14, fontWeight: 500 }}>Nome</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nome completo"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={{ fontSize: 14, fontWeight: 500 }}>Email *</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="usuario@tna.studio"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={{ fontSize: 14, fontWeight: 500 }}>Senha *</label>
        <input
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Senha temporária"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={{ fontSize: 14, fontWeight: 500 }}>CPF *</label>
        <input
          type="text"
          value={form.cpf}
          onChange={(e) => setForm({ ...form, cpf: e.target.value.replace(/\D/g, "") })}
          maxLength={11}
          placeholder="00000000000"
          required
          style={inputStyle}
        />
        <span style={{ fontSize: 12, color: "#6b7280" }}>11 dígitos, apenas números</span>
      </div>
      <div>
        <label style={{ fontSize: 14, fontWeight: 500 }}>Telefone *</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+5561999999999"
          required
          style={inputStyle}
        />
        <span style={{ fontSize: 12, color: "#6b7280" }}>Formato: +5561999999999</span>
      </div>
      <div>
        <label style={{ fontSize: 14, fontWeight: 500 }}>Data de Nascimento *</label>
        <input
          type="date"
          value={form.birthDate}
          onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
          max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
          required
          style={inputStyle}
        />
        <span style={{ fontSize: 12, color: "#6b7280" }}>Mínimo 18 anos</span>
      </div>
      <div>
        <label style={{ fontSize: 14, fontWeight: 500 }}>Perfil</label>
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          style={{ ...inputStyle, appearance: "auto" }}
        >
          {roles
            .sort((a, b) => {
              // MODELO primeiro, depois ordem alfabética
              if (a === "MODELO") return -1;
              if (b === "MODELO") return 1;
              return a.localeCompare(b);
            })
            .map((role) => (
              <option key={role} value={role}>
                {role.toLowerCase()}
              </option>
            ))}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 14, fontWeight: 500 }}>Foto de Perfil (Opcional)</label>
        {profileImagePreview && (
          <div style={{ marginBottom: "0.5rem" }}>
            <img
              src={profileImagePreview}
              alt="Preview"
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #e5e7eb",
              }}
            />
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleProfileImageChange}
          disabled={loading || uploadingImage}
          style={{
            ...inputStyle,
            padding: "0.5rem",
            cursor: loading || uploadingImage ? "not-allowed" : "pointer",
          }}
        />
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          JPG, PNG ou WebP. Máximo 3 MB.
        </span>
      </div>
      {error && <p style={{ color: "#b91c1c", fontSize: 14 }}>{error}</p>}
      {success && <p style={{ color: "#059669", fontSize: 14 }}>{success}</p>}
      <button
        type="submit"
        disabled={loading || uploadingImage}
        style={{
          padding: "0.75rem 1.5rem",
          borderRadius: 8,
          background: loading || uploadingImage ? "#9ca3af" : "#2563eb",
          color: "#fff",
          fontWeight: 600,
          border: "none",
          cursor: loading || uploadingImage ? "not-allowed" : "pointer",
          fontSize: 14,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!loading && !uploadingImage) {
            e.currentTarget.style.background = "#1d4ed8";
          }
        }}
        onMouseLeave={(e) => {
          if (!loading && !uploadingImage) {
            e.currentTarget.style.background = "#2563eb";
          }
        }}
      >
        {uploadingImage ? "Enviando foto..." : loading ? "Criando..." : "Adicionar usuário"}
      </button>
      <p style={{ fontSize: 12, color: "#6b7280" }}>
        * Campos obrigatórios: Nome, Email, Senha, CPF, Telefone, Data de Nascimento.
        <br />
        As senhas criadas aqui podem ser trocadas pelo usuário em breve.
      </p>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  marginTop: "0.35rem",
};

