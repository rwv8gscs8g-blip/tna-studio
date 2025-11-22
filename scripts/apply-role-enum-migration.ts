import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Aplicando migration do enum Role...");

  try {
    // Passo 1: Converter coluna User.role para TEXT temporariamente
    console.log("📝 Passo 1: Convertendo User.role para TEXT...");
    await prisma.$executeRaw`ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT`;
    await prisma.$executeRaw`ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT USING role::text`;
    
    // Passo 2: Atualizar valores de texto
    console.log("📝 Passo 2: Atualizando valores de texto...");
    await prisma.$executeRaw`UPDATE "User" SET role = 'MODELO' WHERE role = 'MODEL'`;
    await prisma.$executeRaw`UPDATE "User" SET role = 'CLIENTE' WHERE role = 'CLIENT'`;
    await prisma.$executeRaw`UPDATE "User" SET role = 'SUPERADMIN' WHERE role = 'SUPER_ADMIN'`;
    
    // Passo 3: Converter ImageRights.allowedRoles para text[] temporariamente
    console.log("📝 Passo 3: Convertendo ImageRights.allowedRoles para text[]...");
    try {
      await prisma.$executeRaw`ALTER TABLE "ImageRights" ALTER COLUMN "allowedRoles" TYPE text[] USING 
        array(
          SELECT 
            CASE 
              WHEN unnest_val::text = 'MODEL' THEN 'MODELO'
              WHEN unnest_val::text = 'CLIENT' THEN 'CLIENTE'
              WHEN unnest_val::text = 'SUPER_ADMIN' THEN 'SUPERADMIN'
              WHEN unnest_val::text = 'ADMIN' THEN 'ADMIN'
              WHEN unnest_val::text = 'ARQUITETO' THEN 'ARQUITETO'
              ELSE unnest_val::text
            END
          FROM unnest("allowedRoles") AS unnest_val
        )`;
    } catch (err: any) {
      // Se a tabela não existir ou não tiver dados, ignora
      console.log("⚠️  ImageRights pode não existir ou estar vazia, continuando...");
    }
    
    // Passo 4: Remover enum antigo (se existir) e criar novo
    console.log("🔄 Passo 4: Recriando enum Role...");
    try {
      await prisma.$executeRaw`DROP TYPE IF EXISTS "Role_old" CASCADE`;
    } catch (err) {
      // Ignora se não existir
    }
    try {
      await prisma.$executeRaw`DROP TYPE IF EXISTS "Role" CASCADE`;
    } catch (err) {
      // Ignora se não existir
    }
    
    // Criar novo enum
    await prisma.$executeRaw`CREATE TYPE "Role" AS ENUM ('ARQUITETO', 'ADMIN', 'MODELO', 'CLIENTE', 'SUPERADMIN')`;
    
    // Passo 5: Converter User.role de volta para enum
    console.log("🔄 Passo 5: Convertendo User.role de volta para enum...");
    await prisma.$executeRaw`ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING role::"Role"`;
    await prisma.$executeRaw`ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MODELO'::"Role"`;
    
    // Passo 6: Converter ImageRights.allowedRoles de volta para Role[]
    console.log("🔄 Passo 6: Convertendo ImageRights.allowedRoles de volta para Role[]...");
    try {
      await prisma.$executeRaw`ALTER TABLE "ImageRights" ALTER COLUMN "allowedRoles" TYPE "Role"[] USING "allowedRoles"::"Role"[]`;
    } catch (err: any) {
      console.log("⚠️  ImageRights pode não existir ou estar vazia, continuando...");
    }

    console.log("✅ Migration do enum Role aplicada com sucesso!");
  } catch (error: any) {
    console.error("❌ Erro ao aplicar migration:", error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

