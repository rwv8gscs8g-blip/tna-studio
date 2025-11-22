"use client";

import { useState } from "react";
import EditUserModal from "./EditUserModal";

type Props = {
  userId: string;
  canEdit?: boolean;
};

export default function EditUserButton({ userId, canEdit = true }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: "0.5rem 1rem",
          background: canEdit ? "#2563eb" : "#6b7280",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        {canEdit ? "Editar" : "Ver"}
      </button>
      {isOpen && (
        <EditUserModal userId={userId} onClose={() => setIsOpen(false)} canEdit={canEdit} />
      )}
    </>
  );
}

