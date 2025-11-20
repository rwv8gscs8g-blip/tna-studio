/**
 * Validação de permissões de acesso a imagens
 * 
 * Verifica se um usuário tem permissão para acessar uma foto
 * baseado em roles, usuários específicos e expiração.
 */

import { Role } from "@prisma/client";
import { prisma } from "./prisma";

export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Verifica se um usuário pode acessar uma foto
 */
export async function canAccessPhoto(
  userId: string,
  userRole: Role | string,
  photoId: string
): Promise<AccessCheckResult> {
  // ADMIN sempre tem acesso (compara tanto enum quanto string)
  if (userRole === Role.ADMIN || userRole === "ADMIN") {
    return { allowed: true };
  }

  // Busca a foto e seus direitos
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: {
      rights: true,
      gallery: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!photo) {
    return { allowed: false, reason: "Foto não encontrada" };
  }

  // Se o usuário é dono da galeria, tem acesso
  if (photo.gallery.userId === userId) {
    return { allowed: true };
  }

  // Verifica direitos específicos da foto
  if (photo.rights) {
    const rights = photo.rights;

    // Verifica expiração
    if (rights.expiresAt && rights.expiresAt < new Date()) {
      return { allowed: false, reason: "Direitos de acesso expirados" };
    }

    // Verifica roles permitidos
    // Converte userRole para Role enum se for string
    const userRoleEnum = typeof userRole === "string" ? (userRole as Role) : userRole;
    if (rights.allowedRoles.includes(userRoleEnum)) {
      return { allowed: true };
    }

    // Verifica usuários específicos
    if (rights.allowedUsers.includes(userId)) {
      return { allowed: true };
    }
  }

  // Verifica acesso à galeria
  const galleryAccess = await prisma.galleryAccess.findUnique({
    where: {
      galleryId_granteeId: {
        galleryId: photo.galleryId,
        granteeId: userId,
      },
    },
  });

  if (galleryAccess) {
    return { allowed: true };
  }

  return { allowed: false, reason: "Sem permissão de acesso" };
}

/**
 * Verifica se um usuário pode acessar uma galeria
 */
export async function canAccessGallery(
  userId: string,
  userRole: Role | string,
  galleryId: string
): Promise<AccessCheckResult> {
  // ADMIN sempre tem acesso (compara tanto enum quanto string)
  if (userRole === Role.ADMIN || userRole === "ADMIN") {
    return { allowed: true };
  }

  const gallery = await prisma.gallery.findUnique({
    where: { id: galleryId },
    include: {
      user: true,
      access: true,
    },
  });

  if (!gallery) {
    return { allowed: false, reason: "Galeria não encontrada" };
  }

  // Se o usuário é dono, tem acesso
  if (gallery.userId === userId) {
    return { allowed: true };
  }

  // Se a galeria é privada, verifica acesso explícito
  if (gallery.isPrivate) {
    const hasAccess = gallery.access.some((a) => a.granteeId === userId);
    if (!hasAccess) {
      return { allowed: false, reason: "Galeria privada - acesso não concedido" };
    }
  }

  return { allowed: true };
}

