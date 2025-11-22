/**
 * Página de Magic Login (Em breve)
 * 
 * Esta página está preparada para futura integração com SMS/WhatsApp/e-mail
 * para envio de códigos de acesso temporários.
 * 
 * FUTURO: Implementar:
 * - Campo para celular/WhatsApp/e-mail
 * - Integração com Twilio para envio de código
 * - Validação de código de 6 dígitos
 * - Login automático após validação
 */

"use client";

import { useState } from "react";
import Link from "next/link";

export default function MagicLoginPage() {
  const [input, setInput] = useState("");

  return (
    <div style={{
      minHeight: "100dvh",
      display: "grid",
      placeItems: "center",
      padding: "2rem",
      background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 480,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: "2rem",
        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: "#111827" }}>
          Código Mágico
        </h1>
        <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 14 }}>
          Indique seu celular, WhatsApp ou e-mail para receber seu código de acesso.
        </p>
        
        <div style={{
          padding: "1rem",
          background: "#fef3c7",
          border: "1px solid #fbbf24",
          borderRadius: 8,
          fontSize: 13,
          color: "#92400e",
          marginBottom: 24,
        }}>
          <strong>Em breve:</strong> Esta funcionalidade estará disponível em breve.
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          alert("Funcionalidade em desenvolvimento. Use o login com senha.");
        }} style={{ display: "grid", gap: 16 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Celular, WhatsApp ou E-mail</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="+5561999999999 ou email@exemplo.com"
              disabled
              style={{
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                background: "#f9fafb",
                color: "#6b7280",
                cursor: "not-allowed",
              }}
            />
          </label>

          <button
            type="submit"
            disabled
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              background: "#9ca3af",
              color: "white",
              fontWeight: 600,
              cursor: "not-allowed",
              fontSize: 14,
            }}
          >
            Enviar código (Em breve)
          </button>
        </form>

        <div style={{ marginTop: 16, fontSize: 13, textAlign: "center" }}>
          <Link href="/signin" style={{ color: "#6b7280", textDecoration: "none" }}>
            Voltar para Login
          </Link>
        </div>
      </div>
    </div>
  );
}

