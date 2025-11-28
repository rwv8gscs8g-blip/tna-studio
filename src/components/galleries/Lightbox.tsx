/**
 * Lightbox Premium - Visualização em tela cheia
 * Fundo escuro/blur, navegação e zoom
 */

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Photo {
  id: string;
  url: string;
  alt?: string;
}

interface LightboxProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

export default function Lightbox({
  photos,
  initialIndex,
  onClose,
}: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    setIsZoomed(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
  };

  if (photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <div
      className="lightbox-premium"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(27, 27, 27, 0.95)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isZoomed ? "zoom-out" : "zoom-in",
      }}
    >
      {/* Botão Fechar */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 z-10 text-white hover:text-gold-bright transition-colors"
        style={{
          fontSize: "2rem",
          width: "48px",
          height: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          border: "none",
          cursor: "pointer",
        }}
        aria-label="Fechar"
      >
        ×
      </button>

      {/* Navegação Anterior */}
      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gold-bright transition-colors"
          style={{
            fontSize: "2rem",
            width: "48px",
            height: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            border: "none",
            cursor: "pointer",
          }}
          aria-label="Foto anterior"
        >
          ‹
        </button>
      )}

      {/* Imagem */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsZoomed(!isZoomed);
        }}
        style={{
          position: "relative",
          maxWidth: "90vw",
          maxHeight: "90vh",
          width: "auto",
          height: "auto",
          transform: isZoomed ? "scale(1.5)" : "scale(1)",
          transition: "transform var(--transition-base)",
        }}
      >
        <Image
          src={currentPhoto.url}
          alt={currentPhoto.alt || `Foto ${currentIndex + 1}`}
          width={1200}
          height={800}
          style={{
            maxWidth: "100%",
            maxHeight: "90vh",
            objectFit: "contain",
            borderRadius: "var(--radius-md)",
          }}
          priority
        />
      </div>

      {/* Navegação Próxima */}
      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gold-bright transition-colors"
          style={{
            fontSize: "2rem",
            width: "48px",
            height: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            border: "none",
            cursor: "pointer",
          }}
          aria-label="Próxima foto"
        >
          ›
        </button>
      )}

      {/* Contador */}
      {photos.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            padding: "0.5rem 1rem",
            borderRadius: "var(--radius-md)",
          }}
        >
          {currentIndex + 1} / {photos.length}
        </div>
      )}
    </div>
  );
}

