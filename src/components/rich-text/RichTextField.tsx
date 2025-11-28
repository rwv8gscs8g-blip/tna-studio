"use client";

import { useState } from "react";
import DOMPurify from "dompurify";
import RichTextEditor from "./RichTextEditor";

// Exportar RichTextEditor como padrão para compatibilidade

interface RichTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

export default function RichTextField(props: RichTextFieldProps) {
  // Usar RichTextEditor (Tiptap) como padrão
  return <RichTextEditor {...props} />;
}

/**
 * Helper para renderizar HTML sanitizado de forma segura
 */
export function renderSanitizedHTML(html: string): string {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "ol", "ul", "li", "h1", "h2", "h3", "h4", "h5", "h6"],
    ALLOWED_ATTR: [],
  });
}

