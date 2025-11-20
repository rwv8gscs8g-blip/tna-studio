import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const testUsers = [
  {
    email: "admin@tna.studio",
    name: "Administrador TNA",
    password: "Admin@2025!",
    role: Role.ADMIN,
  },
  {
    email: "model1@tna.studio",
    name: "Modelo 1 - Ana Silva",
    password: "Model1@2025!",
    role: Role.MODEL,
  },
  {
    email: "client1@tna.studio",
    name: "Cliente 1 - João Oliveira",
    password: "Client1@2025!",
    role: Role.CLIENT,
  },
] as const;

async function main() {
  console.log("🌱 Iniciando seed mínimo de usuários...");

  for (const user of testUsers) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    const result = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
      },
    });

    console.log(
      `✅ ${result.email} (${result.role}) pronto. Senha padrão: ${user.password}`,
    );
  }

  console.log("\n👥 Usuários de teste criados com sucesso.");
  console.log("Use essas credenciais para validar o login local.");
}

main()
  .catch((error) => {
    console.error("❌ Erro no seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

