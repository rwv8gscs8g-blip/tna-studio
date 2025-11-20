/**
 * Funções seguras de storage com validação de permissões
 * 
 * Combina R2 storage com validação de direitos de acesso
 */

import { getSignedUrl } from "./r2";
import { canAccessPhoto } from "./image-rights";
import { Role } from "@prisma/client";

/**
 * Gera URL assinada segura para uma foto
 * Valida permissões antes de gerar a URL
 */
export async function getSecurePhotoUrl(
  photoId: string,
  userId: string,
  userRole: Role,
  expiresIn: number = 3600 // 1 hora padrão
): Promise<{ url: string } | { error: string }> {
  // Valida permissões
  const accessCheck = await canAccessPhoto(userId, userRole, photoId);
  
  if (!accessCheck.allowed) {
    return { error: accessCheck.reason || "Acesso negado" };
  }

  // Busca a key da foto
  const { prisma } = await import("./prisma");
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: { key: true },
  });

  if (!photo) {
    return { error: "Foto não encontrada" };
  }

  // Gera URL assinada (passa photoId para usar rota de dev se necessário)
  const url = await getSignedUrl(photo.key, expiresIn, photoId);
  
  return { url };
}

