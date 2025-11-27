"use client";

import { useState, useEffect } from "react";
import { Role } from "@prisma/client";
import ResetPasswordButton from "./ResetPasswordButton";

type Props = {
  userId: string;
  onClose: () => void;
  canEdit?: boolean;
};

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  phone: string | null;
  cpf: string | null;
  passport: string | null;
  birthDate: string | null;
  address: string | null;
  zipCode: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  profileImage: string | null;
}

export default function EditUserModal({ userId, onClose, canEdit = true }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [form, setForm] = useState<Partial<UserData>>({});
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          credentials: "include",
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          setError(errorData.error || "Erro ao carregar dados do usuário");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setUser(data);
        setForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          cpf: data.cpf || "",
          passport: data.passport || "",
          birthDate: data.birthDate ? data.birthDate.split("T")[0] : "",
          role: data.role,
          address: data.address || "",
          zipCode: data.zipCode || "",
          city: data.city || "",
          state: data.state || "",
          country: data.country || "",
          profileImage: data.profileImage || null,
        });
        setProfileImagePreview(data.profileImage || null);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar usuário");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [userId]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Se não pode editar, não permite submit
    if (!canEdit) {
      setError("Somente leitura. Apenas o ARQUITETO pode editar usuários.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    let profileImageUrl: string | null = form.profileImage || null;

    // Upload da foto de perfil se houver nova
    if (profileImageFile) {
      setUploadingImage(true);
      try {
        const formData = new FormData();
        formData.append("file", profileImageFile);
        formData.append("userId", userId);

        const uploadRes = await fetch("/api/admin/users/upload-profile-image", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json().catch(() => ({}));
          setError(uploadData.error ?? "Erro ao fazer upload da foto de perfil.");
          setSaving(false);
          setUploadingImage(false);
          return;
        }

        const uploadData = await uploadRes.json();
        profileImageUrl = uploadData.url;
      } catch (err: any) {
        setError("Erro ao fazer upload da foto de perfil.");
        setSaving(false);
        setUploadingImage(false);
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          profileImage: profileImageUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Filtrar mensagens de erro que não devem aparecer para ARQUITETO
        const errorMessage = data.error || "Erro ao atualizar usuário";
        // Se é uma mensagem de "sessão inválida" e canEdit é true, pode ser um erro temporário
        // Apenas mostrar mensagens claras e úteis
        setError(errorMessage);
        return;
      }

      setSuccess("Usuário atualizado com sucesso!");
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar usuário");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
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
      >
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: 12,
            maxWidth: 600,
            width: "90%",
          }}
        >
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: 12,
          maxWidth: 700,
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>
            {canEdit ? "Editar Usuário" : "Ver Usuário"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            ×
          </button>
        </div>

        {!canEdit && (
          <div style={{ 
            padding: "1rem", 
            background: "#fef3c7", 
            border: "1px solid #fbbf24", 
            borderRadius: 8,
            fontSize: 13,
            color: "#92400e",
            marginBottom: "1rem"
          }}>
            <strong>⚠️ Somente leitura:</strong> Você não tem permissão para editar usuários. Apenas o ARQUITETO pode fazer alterações.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                Nome
              </label>
              <input
                type="text"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={!canEdit}
                readOnly={!canEdit}
                style={getInputStyle(canEdit)}
              />
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                Email *
              </label>
              <input
                type="email"
                required
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={!canEdit}
                readOnly={!canEdit}
                style={getInputStyle(canEdit)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                Telefone
              </label>
              <input
                type="tel"
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+5561999999999"
                disabled={!canEdit}
                readOnly={!canEdit}
                style={getInputStyle(canEdit)}
              />
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                CPF
              </label>
              <input
                type="text"
                value={form.cpf || ""}
                onChange={(e) => setForm({ ...form, cpf: e.target.value.replace(/\D/g, "") })}
                maxLength={11}
                placeholder="00000000000"
                disabled={!canEdit}
                readOnly={!canEdit}
                style={getInputStyle(canEdit)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                Passaporte
              </label>
              <input
                type="text"
                value={form.passport || ""}
                onChange={(e) => setForm({ ...form, passport: e.target.value.toUpperCase() })}
                placeholder="AB1234567"
                disabled={!canEdit}
                readOnly={!canEdit}
                style={getInputStyle(canEdit)}
              />
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                Data de Nascimento
              </label>
              <input
                type="date"
                value={form.birthDate || ""}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                disabled={!canEdit}
                readOnly={!canEdit}
                style={getInputStyle(canEdit)}
              />
              {form.birthDate && (
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: "0.25rem" }}>
                  Idade atual: {(() => {
                    const birth = new Date(form.birthDate);
                    const today = new Date();
                    let age = today.getFullYear() - birth.getFullYear();
                    const monthDiff = today.getMonth() - birth.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                      age--;
                    }
                    return age;
                  })()} anos
                </p>
              )}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
              Perfil
            </label>
            <select
              value={form.role || "MODELO"}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              disabled={!canEdit}
              style={{ ...getInputStyle(canEdit), cursor: canEdit ? "pointer" : "not-allowed" }}
            >
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>
                  {role.toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
              Foto de Perfil
            </label>
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
              disabled={!canEdit || saving || uploadingImage}
              readOnly={!canEdit}
              style={{
                ...getInputStyle(canEdit),
                padding: "0.5rem",
                cursor: canEdit && !saving && !uploadingImage ? "pointer" : "not-allowed",
              }}
            />
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              JPG, PNG ou WebP. Máximo 3 MB.
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                Endereço
              </label>
              <input
                type="text"
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                disabled={!canEdit}
                readOnly={!canEdit}
                style={getInputStyle(canEdit)}
              />
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                CEP
              </label>
              <input
                type="text"
                value={form.zipCode || ""}
                onChange={(e) => setForm({ ...form, zipCode: e.target.value.replace(/\D/g, "") })}
                maxLength={8}
                disabled={!canEdit}
                readOnly={!canEdit}
                style={getInputStyle(canEdit)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                Cidade
              </label>
              <input
                type="text"
                value={form.city || ""}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                disabled={!canEdit}
                readOnly={!canEdit}
                style={getInputStyle(canEdit)}
              />
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                Estado
              </label>
              <input
                type="text"
                value={form.state || ""}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                disabled={!canEdit}
                readOnly={!canEdit}
                style={getInputStyle(canEdit)}
              />
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
                País
              </label>
              <input
                type="text"
                value={form.country || ""}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                disabled={!canEdit}
                readOnly={!canEdit}
                style={getInputStyle(canEdit)}
              />
            </div>
          </div>

          {canEdit && (
            <>
              <div style={{ 
                padding: "1rem", 
                background: "#fef3c7", 
                border: "1px solid #fbbf24", 
                borderRadius: 8,
                fontSize: 13,
                color: "#92400e",
                marginBottom: "1rem"
              }}>
                <strong>⚠️ Importante:</strong> Esta operação requer Certificado A1 válido. 
                A senha do certificado será solicitada via biometria (Touch ID/Face ID) no MacBook.
              </div>
              <div style={{ 
                padding: "1rem", 
                background: "#f9fafb", 
                border: "1px solid #e5e7eb", 
                borderRadius: 8,
                fontSize: 13,
                color: "#374151"
              }}>
                <ResetPasswordButton 
                  userId={userId}
                  userEmail={user?.email}
                  userName={user?.name}
                />
              </div>
            </>
          )}

          {error && (
            <div style={{ padding: "1rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b" }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ padding: "1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#065f46" }}>
              {success}
            </div>
          )}

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.75rem 1.5rem",
                background: "transparent",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Cancelar
            </button>
            {canEdit ? (
              <button
                type="submit"
                disabled={saving || uploadingImage}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: saving || uploadingImage ? "#9ca3af" : "#111827",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: saving || uploadingImage ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {uploadingImage ? "Enviando foto..." : saving ? "Salvando..." : "Salvar Alterações"}
              </button>
            ) : (
              <button
                type="button"
                disabled
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#9ca3af",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "not-allowed",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Somente leitura
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

const getInputStyle = (canEdit: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "0.65rem 0.75rem",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 14,
  opacity: canEdit ? 1 : 0.6,
  cursor: canEdit ? "text" : "not-allowed",
  backgroundColor: canEdit ? "#fff" : "#f9fafb",
});

