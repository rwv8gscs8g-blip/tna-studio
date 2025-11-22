/**
 * Validação de Acesso a Galerias por CPF
 * Garante que apenas o dono (mesmo CPF) ou admin pode acessar
 */

import { prisma } from "./prisma";
import { Role } from "@prisma/client";

export interface GalleryAccessCheck {
  allowed: boolean;
  reason?: string;
}

/**
 * Verifica se usuário pode acessar uma galeria
 * Regras:
 * - Admin sempre tem acesso
 * - Usuário com mesmo CPF/passaporte da galeria tem acesso
 * - Outros usuários não têm acesso
 */
export async function canAccessGalleryByCpf(
  userId: string,
  userRole: Role,
  userCpf: string | null,
  userPassport: string | null,
  galleryId: string
): Promise<GalleryAccessCheck> {
  // Admin sempre tem acesso
  if (userRole === Role.ADMIN) {
    return { allowed: true };
  }

  // Busca galeria
  const gallery = await prisma.gallery.findUnique({
    where: { id: galleryId },
    select: {
      ownerCpf: true,
      ownerPassport: true,
      userId: true,
    },
  });

  if (!gallery) {
    return { allowed: false, reason: "Galeria não encontrada" };
  }

  // Se galeria tem userId e é o mesmo usuário, permite
  if (gallery.userId === userId) {
    return { allowed: true };
  }

  // Verifica por CPF
  if (gallery.ownerCpf && userCpf && gallery.ownerCpf === userCpf) {
    return { allowed: true };
  }

  // Verifica por passaporte
  if (gallery.ownerPassport && userPassport && gallery.ownerPassport === userPassport) {
    return { allowed: true };
  }

  // Acesso negado
  return {
    allowed: false,
    reason: "Você não tem permissão para acessar esta galeria",
  };
}

/**
 * Verifica se usuário pode acessar uma foto
 * Mesmas regras da galeria
 */
export async function canAccessPhotoByCpf(
  userId: string,
  userRole: Role,
  userCpf: string | null,
  userPassport: string | null,
  photoId: string
): Promise<GalleryAccessCheck> {
  // Admin sempre tem acesso
  if (userRole === Role.ADMIN) {
    return { allowed: true };
  }

  // Busca foto e galeria
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: {
      Gallery: {
        select: {
          ownerCpf: true,
          ownerPassport: true,
          userId: true,
        },
      },
    },
  });

  if (!photo) {
    return { allowed: false, reason: "Foto não encontrada" };
  }

  const gallery = photo.Gallery;

  // Se galeria tem userId e é o mesmo usuário, permite
  if (gallery.userId === userId) {
    return { allowed: true };
  }

  // Verifica por CPF
  if (gallery.ownerCpf && userCpf && gallery.ownerCpf === userCpf) {
    return { allowed: true };
  }

  // Verifica por passaporte
  if (gallery.ownerPassport && userPassport && gallery.ownerPassport === userPassport) {
    return { allowed: true };
  }

  // Acesso negado
  return {
    allowed: false,
    reason: "Você não tem permissão para acessar esta foto",
  };
}

