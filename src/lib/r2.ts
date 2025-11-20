/**
 * Cliente R2 (Cloudflare Object Storage)
 * 
 * Configuração básica para interagir com R2 via S3-compatible API.
 * Em desenvolvimento, pode usar um mock ou storage local.
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Configuração do cliente S3 compatível com R2
const getR2Client = () => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || "tna-studio-media";
  const endpoint = accountId 
    ? `https://${accountId}.r2.cloudflarestorage.com`
    : undefined;

  if (!accessKeyId || !secretAccessKey) {
    console.warn("⚠️ R2 credentials não configuradas. Usando modo mock em desenvolvimento.");
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

export const r2Client = getR2Client();
export const R2_BUCKET = process.env.R2_BUCKET_NAME || "tna-studio-media";

/**
 * Upload seguro de arquivo para R2
 */
export async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<void> {
  if (!r2Client) {
    console.warn(`[MOCK] Upload simulado: ${key} (${contentType})`);
    return;
  }

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Sem cache público - sempre privado
      CacheControl: "no-cache, no-store, must-revalidate",
      Metadata: {
        uploadedAt: new Date().toISOString(),
      },
    })
  );
}

/**
 * Gera URL assinada temporária para download seguro
 * 
 * Em desenvolvimento: usa rota local /api/media/serve/[photoId]
 * Em produção: usa URLs assinadas reais do R2 se configurado, senão retorna erro
 */
export async function getSignedUrl(key: string, expiresIn: number = 3600, photoId?: string): Promise<string> {
  const isDevelopment = process.env.NODE_ENV === "development";
  const hasR2Config = !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);

  // Em desenvolvimento, SEMPRE usa rota local (mesmo se R2 estiver configurado)
  if (isDevelopment && photoId) {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const localUrl = `${baseUrl}/api/media/serve/${photoId}`;
    console.log(`[R2] Modo DEV: usando rota local para photoId=${photoId}`);
    return localUrl;
  }

  // Em produção, R2 DEVE estar configurado
  if (!hasR2Config || !r2Client) {
    const errorMsg = isDevelopment
      ? `[R2] r2Client não configurado em dev. Usando mock.`
      : `[R2] ERRO: r2Client não configurado em produção! Configure R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY.`;
    
    console.error(errorMsg);
    
    if (!isDevelopment) {
      throw new Error("Storage R2 não configurado em produção");
    }
    
    // Em dev, retorna URL mock como fallback
    return `https://mock-r2.example.com/${key}?expires=${Date.now() + expiresIn * 1000}`;
  }

  // Produção: gera URL assinada real do R2
  try {
    const { getSignedUrl: s3GetSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });

    const signedUrl = await s3GetSignedUrl(r2Client, command, { expiresIn });
    console.log(`[R2] URL assinada gerada para key=${key.substring(0, 30)}... (expira em ${expiresIn}s)`);
    return signedUrl;
  } catch (error: any) {
    console.error(`[R2] Erro ao gerar URL assinada:`, error);
    throw new Error(`Falha ao gerar URL assinada: ${error.message}`);
  }
}

/**
 * Remove arquivo do R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  if (!r2Client) {
    console.warn(`[MOCK] Delete simulado: ${key}`);
    return;
  }

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
}

