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
 * Gera URL assinada temporária para download seguro (R2)
 * 
 * IMPORTANTE: URLs são efêmeras (30s-2min) e sempre protegidas por autenticação.
 * NUNCA retorna a chave (key) em claro para o cliente, apenas a signed URL temporária.
 * 
 * @param key - Chave do objeto no R2 (ex: "ensaio-123/photo-01.jpg")
 * @param expiresInSeconds - Tempo de expiração em segundos (padrão: 60s para URLs efêmeras)
 * @returns URL assinada temporária que expira rapidamente
 */
export async function getSignedUrlForKey(
  key: string, 
  opts: { expiresInSeconds: number } = { expiresInSeconds: 60 }
): Promise<string> {
  const { expiresInSeconds } = opts;
  const hasR2Config = !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);

  // Sempre requer R2 configurado (mesmo em dev, se estiver usando R2 real)
  if (!hasR2Config || !r2Client) {
    const errorMsg = `[R2] Storage não configurado. Configure R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY.`;
    console.error(errorMsg);
    throw new Error("Storage R2 não configurado");
  }

  // Gera URL assinada real do R2 com expiração curta
  try {
    const { getSignedUrl: s3GetSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });

    // URLs efêmeras: máximo 2 minutos (120s), mínimo 30s
    const safeExpiresIn = Math.min(Math.max(expiresInSeconds, 30), 120);
    
    const signedUrl = await s3GetSignedUrl(r2Client, command, { expiresIn: safeExpiresIn });
    
    // Log apenas em dev (nunca logar keys completas em produção)
    if (process.env.NODE_ENV === "development") {
      console.log(`[R2] URL assinada gerada para key=${key.substring(0, 30)}... (expira em ${safeExpiresIn}s)`);
    }
    
    return signedUrl;
  } catch (error: any) {
    console.error(`[R2] Erro ao gerar URL assinada:`, error);
    throw new Error(`Falha ao gerar URL assinada: ${error.message}`);
  }
}

/**
 * @deprecated Use getSignedUrlForKey() ao invés desta função
 * Mantida apenas para compatibilidade com código antigo (Galleries)
 */
export async function getSignedUrl(key: string, expiresIn: number = 3600, photoId?: string): Promise<string> {
  return getSignedUrlForKey(key, { expiresInSeconds: expiresIn });
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

