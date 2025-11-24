"use client";

import { useState } from "react";

interface DownloadTermButtonProps {
  ensaioId: string;
}

export default function DownloadTermButton({ ensaioId }: DownloadTermButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(`/api/ensaios/${ensaioId}/term`);
      const data = await res.json();
      
      if (data.signedUrl) {
        // Abrir signed URL em nova aba para download
        window.open(data.signedUrl, "_blank");
      } else {
        alert("Erro ao gerar link de download.");
      }
    } catch (error) {
      console.error("Erro ao baixar contrato:", error);
      alert("Erro ao baixar contrato. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      style={{
        display: "inline-block",
        padding: "0.75rem 1.5rem",
        background: loading ? "#6b7280" : "#111827",
        color: "#fff",
        borderRadius: 8,
        border: "none",
        fontSize: 14,
        fontWeight: 600,
        whiteSpace: "nowrap",
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "Carregando..." : "📄 Baixar Contrato"}
    </button>
  );
}

