/**
 * Sistema de Design Padronizado para Botões
 * 
 * Cores:
 * - Azul (#2563eb): Ações primárias e normais
 * - Vermelho (#dc2626): Ações críticas (deleção, perigo)
 * - Cinza (#6b7280): Ações secundárias e neutras
 */

export const buttonStyles = {
  // Botão primário (dourado premium) - ações principais
  primary: {
    background: "#C29B43", // Gold primary
    color: "#ffffff",
    border: "none",
    padding: "0.625rem 1.25rem",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    hover: {
      background: "#D4AF37", // Gold bright
    },
    disabled: {
      background: "#9ca3af",
      cursor: "not-allowed",
    },
  },
  
  // Botão secundário (cinza) - ações secundárias
  secondary: {
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #e5e7eb",
    padding: "0.625rem 1.25rem",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
    hover: {
      background: "#e5e7eb",
      color: "#111827",
    },
    disabled: {
      background: "#f9fafb",
      color: "#9ca3af",
      cursor: "not-allowed",
    },
  },
  
  // Botão de perigo (vermelho) - deleção e ações críticas
  danger: {
    background: "#dc2626",
    color: "#ffffff",
    border: "none",
    padding: "0.625rem 1.25rem",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    hover: {
      background: "#b91c1c",
    },
    disabled: {
      background: "#fca5a5",
      cursor: "not-allowed",
    },
  },
  
  // Botão ghost (transparente) - ações discretas
  ghost: {
    background: "transparent",
    color: "#6b7280",
    border: "1px solid #e5e7eb",
    padding: "0.625rem 1.25rem",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
    hover: {
      background: "#f9fafb",
      color: "#111827",
    },
    disabled: {
      color: "#9ca3af",
      cursor: "not-allowed",
    },
  },
  
  // Botão de link (sem borda) - navegação
  link: {
    background: "transparent",
    color: "#C29B43", // Gold primary
    border: "none",
    padding: "0.5rem 0.75rem",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
    textDecoration: "none",
    hover: {
      color: "#D4AF37", // Gold bright
      background: "rgba(194, 155, 67, 0.1)", // Gold com opacidade
    },
    disabled: {
      color: "#9ca3af",
      cursor: "not-allowed",
    },
  },
};

/**
 * Função helper para obter estilos de botão com hover
 */
export function getButtonStyle(
  variant: "primary" | "secondary" | "danger" | "ghost" | "link" = "primary",
  disabled: boolean = false
) {
  const style = buttonStyles[variant];
  
  return {
    ...style,
    ...(disabled && style.disabled),
  };
}

/**
 * Função helper para obter handlers de hover
 */
export function getButtonHoverHandlers(
  variant: "primary" | "secondary" | "danger" | "ghost" | "link" = "primary",
  disabled: boolean = false
) {
  const style = buttonStyles[variant];
  
  if (disabled) {
    return {
      onMouseEnter: () => {},
      onMouseLeave: () => {},
    };
  }
  
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      if (style.hover) {
        Object.assign(e.currentTarget.style, style.hover);
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      const baseStyle = getButtonStyle(variant, disabled);
      Object.assign(e.currentTarget.style, {
        background: baseStyle.background,
        color: baseStyle.color,
        border: baseStyle.border,
      });
    },
  };
}

