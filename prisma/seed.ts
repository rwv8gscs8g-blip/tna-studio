import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@tna.studio";
  const plain = "Tna@2025!";
  const passwordHash = await bcrypt.hash(plain, 12);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      name: "Administrador",
      passwordHash,
      role: "ADMIN", // ✅ Enum em maiúsculas
    },
  });

  console.log(`
✅ Usuário criado/atualizado com sucesso!
E-mail: ${email}
Senha:  ${plain}
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());