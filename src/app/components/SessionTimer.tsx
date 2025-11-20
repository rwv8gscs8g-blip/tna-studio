"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

/**
 * SessionTimer - Componente APENAS VISUAL
 * 
 * IMPORTANTE: Este componente é apenas para exibição. Toda lógica de segurança
 * está no servidor (callbacks jwt/session em auth.ts). O servidor valida token.exp
 * usando seu próprio Date.now() e rejeita tokens expirados independente do
 * relógio do cliente.
 */
export default function SessionTimer() {
  const { data: session } = useSession();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!session?.expires) {
      setSecondsLeft(null);
      return;
    }

    // Calcula tempo restante baseado em session.expires do servidor
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expires = new Date(session.expires).getTime();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      return diff;
    };

    // Atualiza imediatamente
    setSecondsLeft(calculateTimeLeft());

    // Atualiza a cada segundo (apenas visual - servidor já valida)
    const timer = setInterval(() => {
      const timeLeft = calculateTimeLeft();
      setSecondsLeft(timeLeft);
      
      // Se expirou, apenas atualiza para 0 (servidor já vai redirecionar)
      if (timeLeft <= 0) {
        setSecondsLeft(0);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session?.expires]);

  // Se não há sessão ou expiração, não mostra o timer
  if (!session?.user || secondsLeft === null) {
    return null;
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 1rem",
        borderRadius: "999px",
        background: "#f3f4f6",
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      <span role="img" aria-label="Timer">
        ⏱️
      </span>
      Sessão expira em {minutes.toString().padStart(2, "0")}:
      {seconds.toString().padStart(2, "0")}
    </div>
  );
}

