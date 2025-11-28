"use client";

import { useEffect, useState } from "react";
import { getEurToBrlRate, formatBrl, formatEur } from "@/lib/currency";

interface CurrencyDisplayProps {
  valueEuro: number | null | undefined;
  highlight?: boolean; // Para ADMIN e MODELO
  showBase?: boolean; // Mostrar valor base em EUR
  showNote?: boolean; // Mostrar nota de rodapé
}

export default function CurrencyDisplay({
  valueEuro,
  highlight = false,
  showBase = true,
  showNote = true,
}: CurrencyDisplayProps) {
  const [brlValue, setBrlValue] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRate() {
      if (!valueEuro || valueEuro === 0) {
        setBrlValue(null);
        setLoading(false);
        return;
      }

      try {
        const currentRate = await getEurToBrlRate();
        setRate(currentRate);
        setBrlValue(valueEuro * currentRate);
      } catch (error) {
        console.error("Erro ao buscar cotação:", error);
        // Fallback: usar taxa padrão
        const fallbackRate = 5.50;
        setRate(fallbackRate);
        setBrlValue(valueEuro * fallbackRate);
      } finally {
        setLoading(false);
      }
    }

    fetchRate();
  }, [valueEuro]);

  if (!valueEuro || valueEuro === 0) {
    return (
      <div style={{ fontSize: highlight ? 28 : 20, fontWeight: 700, color: "#92400e" }}>
        Cortesia
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ fontSize: highlight ? 28 : 20, color: "#6b7280" }}>
        Carregando...
      </div>
    );
  }

  return (
    <div>
      {/* Valor principal em BRL */}
      <div
        style={{
          fontSize: highlight ? 32 : 24,
          fontWeight: 700,
          color: highlight ? "#166534" : "#111827",
          marginBottom: showBase || showNote ? "0.5rem" : 0,
        }}
      >
        {formatBrl(brlValue)}
      </div>

      {/* Valor base em EUR (secundário) */}
      {showBase && (
        <div
          style={{
            fontSize: 14,
            color: "#6b7280",
            marginBottom: showNote ? "0.25rem" : 0,
          }}
        >
          Base: {formatEur(valueEuro)}
        </div>
      )}

      {/* Nota de rodapé com cotação */}
      {showNote && rate && (
        <div
          style={{
            fontSize: 11,
            color: "#9ca3af",
            fontStyle: "italic",
          }}
        >
          Conversão estimada (Cotação do dia: R$ {rate.toFixed(2)})
        </div>
      )}
    </div>
  );
}

