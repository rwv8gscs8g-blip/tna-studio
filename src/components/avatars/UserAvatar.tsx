/**
 * Componente para exibir avatar do usuário
 * Suporta storageKey (converte para URL assinada) ou URL direta
 */

"use client";

import { useEffect, useState } from "react";

interface UserAvatarProps {
  userId: string;
  profileImage: string | null;
  name?: string | null;
  email?: string;
  size?: number;
  className?: string;
}

export default function UserAvatar({
  userId,
  profileImage,
  name,
  email,
  size = 40,
  className,
}: UserAvatarProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileImage) {
      setLoading(false);
      return;
    }

    // Se já é uma URL completa, usar diretamente
    if (profileImage.startsWith("http")) {
      setImageUrl(profileImage);
      setLoading(false);
      return;
    }

    // Caso contrário, buscar URL assinada
    fetch(`/api/users/${userId}/profile-image`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.signedUrl) {
          setImageUrl(data.signedUrl);
        }
      })
      .catch((err) => {
        console.error("[UserAvatar] Erro ao buscar foto:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId, profileImage]);

  const initial = (name || email || "U").charAt(0).toUpperCase();

  if (loading) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
          fontSize: size * 0.4,
          fontWeight: 600,
          border: "1px solid #e5e7eb",
        }}
      >
        ...
      </div>
    );
  }

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name || "Usuário"}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "1px solid #e5e7eb",
        }}
        onError={(e) => {
          // Fallback para inicial se imagem falhar
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; width: ${size}px; height: ${size}px; border-radius: 50%; background-color: #e5e7eb; color: #6b7280; font-size: ${size * 0.4}px; font-weight: 600; border: 1px solid #e5e7eb;">${initial}</div>`;
          }
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#6b7280",
        fontSize: size * 0.4,
        fontWeight: 600,
        border: "1px solid #e5e7eb",
      }}
    >
      {initial}
    </div>
  );
}

