import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Criando/atualizando usuário ARQUITETO...");

  const email = "[redacted-email]";
  const password = "[redacted-password]";
  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Luís Maurício Junqueira Zanin",
      role: "ARQUITETO",
      passwordHash: hash,
    },
    create: {
      email,
      name: "Luís Maurício Junqueira Zanin",
      role: "ARQUITETO",
      passwordHash: hash,
    },
  });

  console.log("\n✅ Usuário arquiteto criado/atualizado:");
  console.log({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    hasPasswordHash: !!user.passwordHash,
  });
  console.log("\n📋 Credenciais:");
  console.log(`   Email: ${email}`);
  console.log(`   Senha: ${password}`);
  console.log(`   Role: ARQUITETO`);
}

main()
  .catch((error) => {
    console.error("❌ Erro ao criar usuário:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

