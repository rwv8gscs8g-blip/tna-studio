/**
 * Masonry Grid Premium - Layout adaptativo para fotos
 * Grid que se adapta a fotos verticais/horizontais sem cortes forçados
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "./Lightbox";

interface Photo {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

interface MasonryGridProps {
  photos: Photo[];
  columns?: number;
  gap?: string;
}

export default function MasonryGrid({
  photos,
  columns = 3,
  gap = "1rem",
}: MasonryGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-shadow">
        <p>Nenhuma foto disponível.</p>
      </div>
    );
  }

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div
        className="masonry-grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap,
        }}
      >
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="masonry-item cursor-pointer group"
            onClick={() => openLightbox(index)}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-cream-secondary)",
              boxShadow: "var(--shadow-sm)",
              transition: "all var(--transition-base)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-lg)";
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div className="relative" style={{ paddingBottom: "100%" }}>
              <Image
                src={photo.url}
                alt={photo.alt || `Foto ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                style={{
                  borderRadius: "var(--radius-md)",
                }}
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQADAD8A"
              />
              <div
                className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"
                style={{
                  borderRadius: "var(--radius-md)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {lightboxOpen && (
        <Lightbox
          photos={photos}
          initialIndex={selectedIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .masonry-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
          }
        }
        @media (max-width: 480px) {
          .masonry-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

