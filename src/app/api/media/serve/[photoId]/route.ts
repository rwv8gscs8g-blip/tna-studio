/**
 * API para servir imagens em modo desenvolvimento
 * 
 * GET /api/media/serve/[photoId]
 * 
 * Em produção, isso não deve ser usado - use URLs assinadas do R2
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessPhoto } from "@/lib/image-rights";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  // Extrai photoId antes do try para estar disponível no catch
  const { photoId } = await params;
  
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não encontrado na sessão" }, { status: 401 });
    }
    const userRole = (session.user as any).role as Role;

    // Capturar contexto de auditoria
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Valida permissões com contexto de auditoria
    const accessCheck = await canAccessPhoto(userId, userRole, photoId, { ip, userAgent });
    if (!accessCheck.allowed) {
      return NextResponse.json({ error: accessCheck.reason || "Acesso negado" }, { status: 403 });
    }

    // Busca a foto (apenas não deletadas)
    const photo = await prisma.photo.findFirst({
      where: { 
        id: photoId,
        deletedAt: null, // Apenas fotos não deletadas
      },
      select: { key: true, mimeType: true },
    });

    if (!photo) {
      return NextResponse.json({ error: "Foto não encontrada" }, { status: 404 });
    }

    // Em desenvolvimento, retorna um SVG placeholder válido
    // Em produção, isso não deve ser usado
    if (process.env.NODE_ENV === "development") {
      const fileName = photo.key.split('/').pop() || 'Imagem';
      const fileSize = photo.key.length > 50 ? photo.key.substring(0, 50) + '...' : photo.key;
      
      // SVG válido e bem formatado
      const placeholderSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="#f3f4f6"/>
  <rect x="50" y="150" width="300" height="100" fill="#e5e7eb" rx="8"/>
  <text x="200" y="190" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">${fileName}</text>
  <text x="200" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">${fileSize}</text>
  <circle cx="200" cy="100" r="30" fill="#d1d5db"/>
  <path d="M 185 100 L 200 85 L 215 100 L 200 115 Z" fill="#9ca3af"/>
</svg>`;
      
      console.log(`[MediaServe] Servindo SVG placeholder para photoId: ${photoId}, key: ${photo.key}`);
      
      return new NextResponse(placeholderSvg, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    console.error(`[MediaServe] Tentativa de usar rota de dev em produção para photoId: ${photoId}`);
    return NextResponse.json({ error: "Esta rota não deve ser usada em produção" }, { status: 403 });
  } catch (error: any) {
    console.error(`[MediaServe] ERRO ao servir imagem photoId=${photoId}:`, error);
    console.error(`[MediaServe] Stack trace:`, error.stack);
    return NextResponse.json(
      { error: error.message || "Erro ao servir imagem" },
      { status: 500 }
    );
  }
}

