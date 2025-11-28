/**
 * GET /api/ensaios/[id]/photos
 * 
 * Retorna lista de fotos do ensaio com URLs assinadas efêmeras.
 * 
 * SEGURANÇA:
 * - Valida autenticação via NextAuth
 * - ARQUITETO/ADMIN: podem ver todos os ensaios (ADMIN só leitura)
 * - MODELO: só pode ver seus próprios ensaios (filtrado por CPF + status PUBLISHED)
 * - URLs são assinadas com expiração curta (60-120s)
 * - Nunca retorna storageKey em claro, apenas signed URLs temporárias
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSignedUrlForKey } from "@/lib/r2";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role as Role;
    const userId = (session.user as any)?.id;
    
    // Buscar CPF do usuário do banco (garantir que está normalizado)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { cpf: true },
    });
    
    const userCpf = user?.cpf ? user.cpf.replace(/\D/g, "") : null; // Normalizar CPF (apenas números)

    const { id } = await params;

    // Buscar ensaio com fotos
    const ensaio = await prisma.ensaio.findFirst({
      where: {
        id,
        deletedAt: null, // Apenas ensaios não deletados
      },
      include: {
        photos: {
          where: { deletedAt: null }, // Apenas fotos não deletadas
          orderBy: [
            { sortOrder: "asc" },
            { createdAt: "desc" },
          ],
        },
      },
    });

    if (!ensaio) {
      return NextResponse.json(
        { error: "Ensaio não encontrado." },
        { status: 404 }
      );
    }

    // Normalizar CPF do ensaio para comparação (apenas números)
    const ensaioCpf = ensaio.subjectCpf ? ensaio.subjectCpf.replace(/\D/g, "") : null;

    // Verificar permissões
    if (userRole === Role.ARQUITETO || userRole === Role.ADMIN) {
      // ARQUITETO: pode ver seus próprios ensaios
      // ADMIN: pode ver todos (só leitura)
      if (userRole === Role.ARQUITETO && ensaio.createdById !== userId) {
        return NextResponse.json(
          { error: "Acesso negado. Você só pode ver seus próprios ensaios." },
          { status: 403 }
        );
      }
    } else if (userRole === Role.MODELO) {
      // MODELO: só pode ver seus próprios ensaios PUBLICADOS
      // Comparar CPFs normalizados (apenas números)
      if (!userCpf || !ensaioCpf || ensaioCpf !== userCpf || ensaio.status !== "PUBLISHED") {
        console.warn(`[API] Acesso negado para MODELO: userCpf=${userCpf}, ensaioCpf=${ensaioCpf}, status=${ensaio.status}`);
        return NextResponse.json(
          { error: "Acesso negado. Você só pode ver seus próprios ensaios publicados." },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Acesso negado." },
        { status: 403 }
      );
    }

    // Gerar URLs assinadas para cada foto
    const photosWithSignedUrls = await Promise.all(
      ensaio.photos.map(async (photo) => {
        try {
          // Durante transição: usar storageKey (novo) ou imageUrl (antigo)
          // Se imageUrl já for uma URL assinada completa do R2, podemos tentar usá-la diretamente
          // Mas preferimos sempre gerar uma nova URL assinada a partir da chave
          const storageKey = (photo as any).storageKey || (photo as any).imageUrl;
          
          if (!storageKey) {
            console.warn(`[API] Foto ${photo.id} sem storageKey/imageUrl`);
            return null;
          }

          // Se imageUrl for uma URL completa (https://...), extrair a chave ou tratar como chave direta
          // Por enquanto, assumimos que storageKey/imageUrl já é uma chave do R2 (ex: "ensaio-123/photo-01.jpg")
          const key = storageKey.startsWith("http") 
            ? storageKey.split(".com/")[1]?.split("?")[0] || storageKey
            : storageKey;

          const signedUrl = await getSignedUrlForKey(key, { expiresInSeconds: 120 });
          
          return {
            id: photo.id,
            sortOrder: photo.sortOrder,
            signedUrl, // URL temporária assinada (expira em 2min)
            createdAt: photo.createdAt,
            // NUNCA retornar storageKey em claro para o cliente
          };
        } catch (error: any) {
          console.error(`[API] Erro ao gerar URL assinada para foto ${photo.id}:`, error);
          return null;
        }
      })
    );

    // Filtrar fotos que falharam ao gerar URL
    const validPhotos = photosWithSignedUrls.filter((p): p is NonNullable<typeof p> => p !== null);

    return NextResponse.json(
      { photos: validPhotos },
      {
        headers: {
          "Cache-Control": "no-store, private",
        },
      }
    );
  } catch (error: any) {
    console.error("[API] Erro ao buscar fotos do ensaio:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar fotos." },
      { status: 500 }
    );
  }
}

