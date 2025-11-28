/**
 * Script de Teste de Integridade do Banco
 * 
 * Valida que o banco tem os dados mínimos necessários:
 * - Pelo menos 4 usuários (ARQUITETO, ADMIN, MODELO, CLIENTE)
 * - Pelo menos 10 produtos ativos
 * - AppConfig singleton existe
 * 
 * Uso: tsx scripts/test-db-integrity.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Testando integridade do banco de dados...\n");

  try {
    // Contar usuários
    const userCount = await prisma.user.count({ where: { deletedAt: null } });
    console.log(`✓ Usuários encontrados: ${userCount}`);

    if (userCount < 4) {
      console.error(`❌ FALHA: Esperado pelo menos 4 usuários, encontrado ${userCount}`);
      process.exit(1);
    }

    // Contar produtos ativos
    const produtoCount = await prisma.produto.count({ 
      where: { 
        deletedAt: null, 
        isActive: true 
      } 
    });
    console.log(`✓ Produtos ativos encontrados: ${produtoCount}`);

    if (produtoCount < 10) {
      console.error(`❌ FALHA: Esperado pelo menos 10 produtos, encontrado ${produtoCount}`);
      process.exit(1);
    }

    // Verificar AppConfig
    const appConfig = await prisma.appConfig.findUnique({ 
      where: { id: "singleton" } 
    });
    
    if (!appConfig) {
      console.error(`❌ FALHA: AppConfig singleton não encontrado`);
      process.exit(1);
    }
    console.log(`✓ AppConfig singleton encontrado`);

    // Verificar usuários obrigatórios
    const arquiteto = await prisma.user.findUnique({ 
      where: { email: "arquiteto@tna.studio" } 
    });
    const admin = await prisma.user.findUnique({ 
      where: { email: "admin@tna.studio" } 
    });
    const modelo = await prisma.user.findUnique({ 
      where: { email: "modelo@tna.studio" } 
    });
    const cliente = await prisma.user.findUnique({ 
      where: { email: "cliente@tna.studio" } 
    });

    if (!arquiteto) {
      console.error(`❌ FALHA: ARQUITETO não encontrado`);
      process.exit(1);
    }
    console.log(`✓ ARQUITETO encontrado: ${arquiteto.email}`);

    if (!admin) {
      console.error(`❌ FALHA: ADMIN não encontrado`);
      process.exit(1);
    }
    console.log(`✓ ADMIN encontrado: ${admin.email}`);

    if (!modelo) {
      console.error(`❌ FALHA: MODELO não encontrado`);
      process.exit(1);
    }
    console.log(`✓ MODELO encontrado: ${modelo.email}`);

    if (!cliente) {
      console.error(`❌ FALHA: CLIENTE não encontrado`);
      process.exit(1);
    }
    console.log(`✓ CLIENTE encontrado: ${cliente.email}`);

    console.log("\n✅ Todos os testes de integridade passaram!");
    console.log(`   Usuários: ${userCount}`);
    console.log(`   Produtos: ${produtoCount}`);
    console.log(`   AppConfig: OK`);
    
  } catch (error: any) {
    console.error("\n❌ ERRO ao testar integridade:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

