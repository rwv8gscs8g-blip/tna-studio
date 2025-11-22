"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

/**
 * SessionTimer - Componente Visual com Avisos e Extensão
 * 
 * IMPORTANTE: Este componente é apenas para exibição. Toda lógica de segurança
 * está no servidor (callbacks jwt/session em auth.ts). O servidor valida token.exp
 * usando seu próprio Date.now() e rejeita tokens expirados independente do
 * relógio do cliente.
 */
export default function SessionTimer() {
  const { data: session, update } = useSession();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [extending, setExtending] = useState(false);
  const [showExpiredMessage, setShowExpiredMessage] = useState(false);

  useEffect(() => {
    if (!session?.expires) {
      setSecondsLeft(null);
      return;
    }

    // Calcula tempo restante baseado em session.expires do servidor
    // IMPORTANTE: session.expires vem do servidor (callback session em auth.ts)
    // O servidor controla a expiração, não o cliente
    // IMPORTANTE: session.expires é um timestamp fixo do servidor, não recalcula a cada render
    const expiresAt = new Date(session.expires).getTime();
    
    const calculateTimeLeft = () => {
      const clientNow = Date.now();
      const diff = Math.max(0, Math.floor((expiresAt - clientNow) / 1000));
      return diff;
    };

    // Atualiza imediatamente
    setSecondsLeft(calculateTimeLeft());

    // Atualiza a cada segundo
    const timer = setInterval(() => {
      const timeLeft = calculateTimeLeft();
      setSecondsLeft(timeLeft);
      
      // Se expirou, mostra mensagem e redireciona
      if (timeLeft <= 0) {
        setSecondsLeft(0);
        setShowExpiredMessage(true);
        // Aguarda 2 segundos antes de redirecionar
        setTimeout(() => {
          window.location.href = "/signin";
        }, 2000);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session?.expires]);

  // Função para estender sessão
  const handleExtend = async () => {
    setExtending(true);
    try {
      // Chama update() que dispara o callback jwt com trigger === "update"
      // O callback jwt detecta o trigger e estende o token em 5 minutos
      await update();
      console.log("[SessionTimer] Sessão estendida com sucesso");
    } catch (error: any) {
      console.error("[SessionTimer] Erro ao estender sessão:", error);
      alert("Erro ao estender sessão. Tente fazer login novamente.");
    } finally {
      setExtending(false);
    }
  };

  // Se não há sessão ou expiração, não mostra o timer
  if (!session?.user || secondsLeft === null) {
    return null;
  }

  // Se expirou, mostra mensagem
  if (showExpiredMessage) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1rem",
          borderRadius: "8px",
          background: "#fee2e2",
          border: "1px solid #fca5a5",
          fontSize: 14,
          fontWeight: 500,
          color: "#991b1b",
        }}
      >
        <span role="img" aria-label="Aviso">⚠️</span>
        Seu tempo de sessão acabou. Efetue login novamente.
      </div>
    );
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isWarning = secondsLeft <= 60; // Menos de 1 minuto
  const isCritical = secondsLeft <= 30; // Menos de 30 segundos

  // Cores baseadas no tempo restante
  const backgroundColor = isCritical
    ? "#fee2e2" // Vermelho claro
    : isWarning
    ? "#fef3c7" // Amarelo claro
    : "#f3f4f6"; // Cinza claro

  const borderColor = isCritical
    ? "#fca5a5" // Vermelho
    : isWarning
    ? "#fcd34d" // Amarelo
    : "transparent";

  const textColor = isCritical
    ? "#991b1b" // Vermelho escuro
    : isWarning
    ? "#92400e" // Amarelo escuro
    : "#374151"; // Cinza escuro

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.5rem 1rem",
        borderRadius: "8px",
        background: backgroundColor,
        border: borderColor ? `1px solid ${borderColor}` : "none",
        fontSize: 14,
        fontWeight: 500,
        color: textColor,
        transition: "all 0.3s ease",
      }}
    >
      <span role="img" aria-label="Timer">
        {isCritical ? "🔴" : isWarning ? "🟡" : "⏱️"}
      </span>
      <span>
        Sessão expira em {minutes.toString().padStart(2, "0")}:
        {seconds.toString().padStart(2, "0")}
      </span>
      {isWarning && (
        <button
          onClick={handleExtend}
          disabled={extending}
          style={{
            marginLeft: "0.5rem",
            padding: "0.25rem 0.75rem",
            borderRadius: "6px",
            background: isCritical ? "#dc2626" : "#f59e0b",
            color: "#fff",
            border: "none",
            fontSize: 12,
            fontWeight: 600,
            cursor: extending ? "not-allowed" : "pointer",
            opacity: extending ? 0.7 : 1,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!extending) {
              e.currentTarget.style.opacity = "0.9";
            }
          }}
          onMouseLeave={(e) => {
            if (!extending) {
              e.currentTarget.style.opacity = "1";
            }
          }}
        >
          {extending ? "Estendendo..." : "+5 min"}
        </button>
      )}
    </div>
  );
}


