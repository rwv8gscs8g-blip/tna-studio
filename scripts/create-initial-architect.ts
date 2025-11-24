/**
 * Script para criar o primeiro usuário ARQUITETO do sistema
 * 
 * Este script deve ser executado após rodar o seed (que não cria usuários).
 * 
 * Variáveis de ambiente necessárias:
 *   INIT_ARCHITECT_NAME - Nome completo do arquiteto
 *   INIT_ARCHITECT_EMAIL - Email do arquiteto
 *   INIT_ARCHITECT_PASSWORD - Senha do arquiteto (será hasheada)
 *   INIT_ARCHITECT_PHONE - Telefone (opcional, formato E.164)
 * 
 * Exemplo de uso:
 *   export INIT_ARCHITECT_NAME="Arquiteto Teste"
 *   export INIT_ARCHITECT_EMAIL="arquiteto@example.com"
 *   export INIT_ARCHITECT_PASSWORD="SenhaSegura123!"
 *   export INIT_ARCHITECT_PHONE="+5500000000000"
 *   npm run create:initial-architect
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔐 Criando primeiro usuário ARQUITETO...\n");

  // Validar variáveis de ambiente obrigatórias
  const name = process.env.INIT_ARCHITECT_NAME;
  const email = process.env.INIT_ARCHITECT_EMAIL;
  const password = process.env.INIT_ARCHITECT_PASSWORD;
  const phone = process.env.INIT_ARCHITECT_PHONE || null;

  if (!name || !email || !password) {
    console.error("❌ Erro: Variáveis de ambiente obrigatórias não configuradas.\n");
    console.error("Configure as seguintes variáveis:");
    console.error("  INIT_ARCHITECT_NAME - Nome completo do arquiteto");
    console.error("  INIT_ARCHITECT_EMAIL - Email do arquiteto");
    console.error("  INIT_ARCHITECT_PASSWORD - Senha do arquiteto");
    console.error("  INIT_ARCHITECT_PHONE - Telefone (opcional, formato E.164)\n");
    console.error("Exemplo:");
    console.error('  export INIT_ARCHITECT_NAME="Arquiteto Teste"');
    console.error('  export INIT_ARCHITECT_EMAIL="arquiteto@example.com"');
    console.error('  export INIT_ARCHITECT_PASSWORD="SenhaSegura123!"');
    console.error('  export INIT_ARCHITECT_PHONE="+5500000000000"');
    console.error("  npm run create:initial-architect\n");
    process.exit(1);
  }

  // Validar formato básico do email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error(`❌ Erro: Email inválido: ${email}`);
    process.exit(1);
  }

  // Validar senha mínima
  if (password.length < 8) {
    console.error("❌ Erro: A senha deve ter pelo menos 8 caracteres");
    process.exit(1);
  }

  try {
    // Verificar se já existe um ARQUITETO
    const existingArquiteto = await prisma.user.findFirst({
      where: {
        role: Role.ARQUITETO,
      },
    });

    if (existingArquiteto) {
      console.warn(`⚠️  Já existe um usuário ARQUITETO no sistema:`);
      console.warn(`   Email: ${existingArquiteto.email}`);
      console.warn(`   Nome: ${existingArquiteto.name}`);
      console.warn(`\n   Não será criado outro usuário ARQUITETO.`);
      console.warn(`   Se deseja criar um novo, remova o existente primeiro.`);
      process.exit(0);
    }

    // Verificar se já existe um usuário com o email informado
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.warn(`⚠️  Já existe um usuário com o email: ${email}`);
      console.warn(`   Role: ${existingUser.role}`);
      console.warn(`   Nome: ${existingUser.name}`);
      console.warn(`\n   Não será criado outro usuário com este email.`);
      process.exit(0);
    }

    // Criar hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Criar usuário ARQUITETO
    const arquiteto = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: Role.ARQUITETO,
        phone: phone || null,
        lgpdAccepted: true,
        gdprAccepted: true,
        termsAccepted: true,
        acceptedAt: new Date(),
      },
    });

    console.log("✅ Usuário ARQUITETO criado com sucesso!\n");
    console.log(`   Nome: ${arquiteto.name}`);
    console.log(`   Email: ${arquiteto.email}`);
    console.log(`   Role: ${arquiteto.role}`);
    if (arquiteto.phone) {
      console.log(`   Telefone: ${arquiteto.phone}`);
    }
    console.log(`\n📝 Próximo passo:`);
    console.log(`   Faça login no sistema com:`);
    console.log(`   Email: ${arquiteto.email}`);
    console.log(`   Senha: [a senha que você configurou em INIT_ARCHITECT_PASSWORD]`);
  } catch (error: any) {
    console.error("❌ Erro ao criar usuário ARQUITETO:", error.message);
    if (error.code === "P2002") {
      console.error("   Já existe um usuário com este email ou CPF.");
    }
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error("❌ Erro inesperado:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

