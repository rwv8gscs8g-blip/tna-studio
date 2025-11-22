"use client";

interface ProjectBadgeProps {
  projeto: {
    id: string;
    name: string;
    active?: boolean;
  };
  onClick?: () => void;
}

export default function ProjectBadge({ projeto, onClick }: ProjectBadgeProps) {
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-block",
        padding: "0.25rem 0.75rem",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: projeto.active !== false ? "#dbeafe" : "#f3f4f6",
        color: projeto.active !== false ? "#1e40af" : "#6b7280",
        cursor: onClick ? "pointer" : "default",
        marginRight: "0.5rem",
        marginBottom: "0.5rem",
      }}
    >
      {projeto.name}
    </span>
  );
}

