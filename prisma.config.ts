import "dotenv/config";
import { defineConfig } from "prisma/config";

// Este arquivo apenas carrega variáveis do .env.local ou .env
// Não sobrescreve DATABASE_URL ou DIRECT_URL
// Essas variáveis devem estar definidas em .env.local ou .env
// O schema.prisma usa env("DATABASE_URL") diretamente

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});
