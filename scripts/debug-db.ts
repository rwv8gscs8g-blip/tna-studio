import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

(async () => {
  console.log("[debug-db] DATABASE_URL:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));
  
  try {
    const users = await prisma.user.findMany({
      select: { email: true, role: true },
      orderBy: { email: "asc" },
    });
    console.log("[debug-db] users:", users);
  } catch (error: any) {
    console.error("[debug-db] erro ao buscar usuários:", error.message);
  }
  
  await prisma.$disconnect();
  process.exit(0);
})();

