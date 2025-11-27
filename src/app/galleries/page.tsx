/**
 * Página de listagem de galerias
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function GalleriesPage() {
  let session = null;
  try {
    session = await auth();
  } catch (error: any) {
    console.error("[GalleriesPage] Erro ao obter sessão:", error);
    redirect("/signin");
  }
  
  if (!session || !session.user) {
    redirect("/signin");
  }

  const userId = (session.user as any).id;
  if (!userId) {
    redirect("/signin");
  }

  const userRole = (session.user as any).role as Role;

  // SUPER_ADMIN não tem acesso a galerias
  if (userRole === Role.SUPERADMIN) {
    redirect("/super-admin/certificates");
  }

  let galleries;

  if (userRole === Role.ADMIN) {
    galleries = await prisma.gallery.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        userId: true,
        isPrivate: true,
        createdAt: true,
        updatedAt: true,
        // Não buscar ownerCpf, ownerPassport, sessionDate se não existirem
        User: {
          select: { name: true, email: true },
        },
        _count: {
          select: { Photo: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } else {
    const owned = await prisma.gallery.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        description: true,
        userId: true,
        isPrivate: true,
        createdAt: true,
        updatedAt: true,
        // Não buscar ownerCpf, ownerPassport, sessionDate se não existirem
        _count: {
          select: { Photo: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const accessed = await prisma.galleryAccess.findMany({
      where: { granteeId: userId },
      select: {
        Gallery: {
          select: {
            id: true,
            title: true,
            description: true,
            userId: true,
            isPrivate: true,
            createdAt: true,
            updatedAt: true,
            // Não buscar ownerCpf, ownerPassport, sessionDate se não existirem
            User: {
              select: { name: true, email: true },
            },
            _count: {
              select: { Photo: true },
            },
          },
        },
      },
    });

    galleries = [
      ...owned.map((g) => ({ ...g, User: null })),
      ...accessed.map((a) => a.Gallery),
    ];
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700 }}>Ensaios Fotográficos</h1>
        {/* Apenas ARQUITETO pode criar ensaios */}
        {userRole === Role.ARQUITETO && (
          <Link
            href="/galleries/new"
            style={{
              display: "inline-block",
              background: "#111",
              color: "#fff",
              padding: "0.75rem 1.5rem",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            Novo Ensaio
          </Link>
        )}
      </div>

      {galleries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#6b7280" }}>
          <p style={{ fontSize: 18, marginBottom: 8 }}>Nenhum ensaio fotográfico encontrado</p>
          <p style={{ fontSize: 14 }}>Crie seu primeiro ensaio fotográfico para começar a fazer upload de fotos.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {galleries.map((gallery) => (
            <Link
              key={gallery.id}
              href={`/galleries/${gallery.id}`}
              style={{
                display: "block",
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "1.5rem",
                textDecoration: "none",
                color: "inherit",
                transition: "box-shadow 0.2s",
              }}
              className="gallery-card"
            >
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
                {gallery.title}
              </h2>
              {gallery.description && (
                <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 12 }}>
                  {gallery.description}
                </p>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, color: "#6b7280" }}>
                <span>{gallery._count.Photo} foto{gallery._count.Photo !== 1 ? "s" : ""}</span>
                {userRole === Role.ADMIN && "User" in gallery && (
                  <span>Por: {gallery.User?.name || gallery.User?.email}</span>
                )}
              </div>
              {gallery.isPrivate && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#9ca3af" }}>
                  🔒 Privada
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

