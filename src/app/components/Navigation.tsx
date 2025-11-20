"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import SignOutButton from "./SignOutButton";

export default function Navigation() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  const userRole = (session.user as any)?.role;

  return (
    <nav
      style={{
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        padding: "1rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <Link
          href="/"
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#111827",
            textDecoration: "none",
          }}
        >
          TNA Studio
        </Link>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link
            href="/galleries"
            style={{
              color: "#6b7280",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              padding: "0.5rem 1rem",
              borderRadius: 6,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.color = "#111827";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#6b7280";
            }}
          >
            Galerias
          </Link>
          <Link
            href="/profile"
            style={{
              color: "#6b7280",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              padding: "0.5rem 1rem",
              borderRadius: 6,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.color = "#111827";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#6b7280";
            }}
          >
            Perfil
          </Link>
          {userRole === "ADMIN" && (
            <>
              <Link
                href="/admin/users"
                style={{
                  color: "#6b7280",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 500,
                  padding: "0.5rem 1rem",
                  borderRadius: 6,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                  e.currentTarget.style.color = "#111827";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#6b7280";
                }}
              >
                Admin
              </Link>
              <Link
                href="/admin/reports"
                style={{
                  color: "#6b7280",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 500,
                  padding: "0.5rem 1rem",
                  borderRadius: 6,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                  e.currentTarget.style.color = "#111827";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#6b7280";
                }}
              >
                Relatórios
              </Link>
            </>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ fontSize: 14, color: "#6b7280" }}>
          {session.user?.email}
        </div>
        <SignOutButton variant="ghost" />
      </div>
    </nav>
  );
}

