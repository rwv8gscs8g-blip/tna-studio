"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface NavLinkProps {
  href: string;
  children: ReactNode;
}

export default function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  
  const isActive = () => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  const active = isActive();

  return (
    <Link
      href={href}
      style={{
        color: "#6b7280",
        textDecoration: "none",
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        padding: "0.5rem 1rem",
        borderRadius: 6,
        transition: "all 0.2s",
        background: active ? "#f3f4f6" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "#f9fafb";
          e.currentTarget.style.color = "#111827";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#6b7280";
        }
      }}
    >
      {children}
    </Link>
  );
}

