"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
}

export default function ButtonLink({ href, children, variant = "primary" }: ButtonLinkProps) {
  const getStyles = () => {
    switch (variant) {
      case "secondary":
        return {
          background: "#f3f4f6",
          hover: "#e5e7eb",
          color: "#374151",
        };
      case "danger":
        return {
          background: "#dc2626",
          hover: "#b91c1c",
          color: "#fff",
        };
      default: // primary
        return {
          background: "#C29B43", // Gold primary
          hover: "#D4AF37", // Gold bright
          color: "#fff",
        };
    }
  };

  const style = getStyles();

  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        padding: "0.75rem 1.5rem",
        background: style.background,
        color: style.color,
        borderRadius: 8,
        textDecoration: "none",
        fontSize: 14,
        fontWeight: 600,
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = style.hover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = style.background;
      }}
    >
      {children}
    </Link>
  );
}

