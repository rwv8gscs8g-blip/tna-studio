/**
 * Rich Text Editor Premium - Tiptap
 * Editor minimalista e elegante para descrições
 */

"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useState, useEffect } from "react";
import DOMPurify from "dompurify";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Digite aqui...",
  disabled = false,
  label,
  minHeight = "200px",
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || "",
    editable: !disabled,
    immediatelyRender: false, // Corrige erro de SSR/hydration
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Sanitizar antes de passar para onChange
      const sanitized = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "ol", "ul", "li", "h2", "h3", "h4"],
        ALLOWED_ATTR: [],
      });
      onChange(sanitized);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none",
        style: `min-height: ${minHeight};`,
      },
    },
  });

  useEffect(() => {
    if (editor && isMounted && value !== editor.getHTML()) {
      // Só atualiza o conteúdo após o mount para evitar hydration mismatch
      editor.commands.setContent(value || "");
    }
  }, [value, editor, isMounted]);

  if (!isMounted) {
    return (
      <div>
        {label && (
          <label className="block mb-2 text-sm font-medium text-black-title">
            {label}
          </label>
        )}
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full p-3 border border-shadow/20 rounded-sm bg-white text-black-text focus:outline-none focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/10"
          style={{ minHeight }}
        />
      </div>
    );
  }

  if (!editor) {
    return null;
  }

  return (
    <div className="rich-text-editor-premium">
      {label && (
        <label className="block mb-2 text-sm font-medium text-black-title">
          {label}
        </label>
      )}
      
      {/* Barra de ferramentas minimalista */}
      <div className="flex items-center gap-1 p-2 bg-cream-secondary border border-shadow/10 rounded-t-sm">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run() || disabled}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            editor.isActive("bold")
              ? "bg-gold-primary text-white"
              : "bg-white text-shadow hover:bg-cream-primary"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          title="Negrito"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run() || disabled}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            editor.isActive("italic")
              ? "bg-gold-primary text-white"
              : "bg-white text-shadow hover:bg-cream-primary"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          title="Itálico"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            editor.isActive("bulletList")
              ? "bg-gold-primary text-white"
              : "bg-white text-shadow hover:bg-cream-primary"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          title="Lista com marcadores"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            editor.isActive("orderedList")
              ? "bg-gold-primary text-white"
              : "bg-white text-shadow hover:bg-cream-primary"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          title="Lista numerada"
        >
          1.
        </button>
      </div>

      {/* Editor */}
      <div className="border border-shadow/20 rounded-b-sm bg-white">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none p-3 focus-within:outline-none"
          style={{ minHeight }}
        />
      </div>

      <style jsx global>{`
        .rich-text-editor-premium .ProseMirror {
          outline: none;
          font-family: var(--font-sans);
          color: var(--color-black-text);
          line-height: 1.6;
        }
        .rich-text-editor-premium .ProseMirror p {
          margin: 0.5rem 0;
        }
        .rich-text-editor-premium .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .rich-text-editor-premium .ProseMirror ul,
        .rich-text-editor-premium .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .rich-text-editor-premium .ProseMirror h2,
        .rich-text-editor-premium .ProseMirror h3,
        .rich-text-editor-premium .ProseMirror h4 {
          font-family: var(--font-serif);
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: var(--color-black-title);
        }
        .rich-text-editor-premium .ProseMirror strong {
          font-weight: 600;
          color: var(--color-black-title);
        }
        .rich-text-editor-premium .ProseMirror em {
          font-style: italic;
        }
      `}</style>
    </div>
  );
}

/**
 * Helper para renderizar HTML sanitizado de forma segura
 */
export function renderSanitizedHTML(html: string): string {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "ol", "ul", "li", "h2", "h3", "h4"],
    ALLOWED_ATTR: [],
  });
}

