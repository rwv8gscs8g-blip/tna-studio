import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

/**
 * Guard de Proteção de Ambiente
 * Previne execução de seed em produção.
 */
function ensureNotProduction(action: string): void {
  if (process.env.NODE_ENV === "production") {
    console.error(`❌ ERRO CRÍTICO: Ação '${action}' bloqueada em ambiente de PRODUÇÃO.`);
    console.error(`   Esta operação é permitida apenas em desenvolvimento.`);
    console.error(`   NODE_ENV atual: ${process.env.NODE_ENV}`);
    process.exit(1);
  }
}

const prisma = new PrismaClient();

/**
 * Helper: Gera slug a partir do texto
 * Ex: 'Pacote 1 - Book Sensual' -> 'pacote-1-book-sensual'
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]+/g, "-") // Substitui caracteres especiais por hífen
    .replace(/^-+|-+$/g, ""); // Remove hífens no início e fim
}

/**
 * Valida se o hash da senha está correto
 */
async function validatePasswordHash(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

async function main() {
  // Proteção crítica: seed NUNCA deve rodar em produção
  ensureNotProduction("Database Seed");
  
  console.log("🌱 Iniciando seed do banco de dados...");
  console.log("📋 Criando usuários e produtos obrigatórios\n");

  // ============================================
  // 1. USUÁRIOS OBRIGATÓRIOS
  // ============================================

  // ARQUITETO
  const arquitetoEmail = "arquiteto@tna.studio";
  const arquitetoPassword = "Arquiteto@2025!";
  const arquitetoPasswordHash = await bcrypt.hash(arquitetoPassword, 12);
  const arquitetoBirthDate = new Date("1974-12-27");
  const today = new Date();
  let age = today.getFullYear() - arquitetoBirthDate.getFullYear();
  const monthDiff = today.getMonth() - arquitetoBirthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < arquitetoBirthDate.getDate())) {
    age--;
  }
  
  if (age < 18) {
    console.error(`❌ ${arquitetoEmail}: Idade ${age} anos é menor que 18 anos!`);
    process.exit(1);
  }

  const arquiteto = await prisma.user.upsert({
    where: { email: arquitetoEmail },
    update: {
      name: "Luís Maurício Junqueira Zanin",
      role: Role.ARQUITETO,
      passwordHash: arquitetoPasswordHash,
      phone: "+5561981321000",
      cpf: "15030004866",
      passport: null,
      birthDate: arquitetoBirthDate,
      lgpdAccepted: true,
      gdprAccepted: true,
      termsAccepted: true,
      acceptedAt: new Date(),
    },
    create: {
      email: arquitetoEmail,
      name: "Luís Maurício Junqueira Zanin",
      role: Role.ARQUITETO,
      passwordHash: arquitetoPasswordHash,
      phone: "+5561981321000",
      cpf: "15030004866",
      passport: null,
      birthDate: arquitetoBirthDate,
      lgpdAccepted: true,
      gdprAccepted: true,
      termsAccepted: true,
      acceptedAt: new Date(),
    },
  });

  // Validar hash do ARQUITETO
  const arquitetoHashValid = await validatePasswordHash(arquitetoPassword, arquiteto.passwordHash);
  if (!arquitetoHashValid) {
    console.error(`❌ Hash da senha do ARQUITETO está inválido!`);
    process.exit(1);
  }

  console.log(`✅ ARQUITETO criado: ${arquiteto.email}`);
  console.log(`   Senha: ${arquitetoPassword} (hash validado: ✓)`);
  console.log(`   ID: ${arquiteto.id}`);

  // ADMIN
  const adminEmail = "admin@tna.studio";
  const adminPassword = "Admin@2025!";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Admin Teste",
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
      cpf: "12345678901",
      phone: "+5561999887766",
      birthDate: new Date("1985-01-15"),
    },
    create: {
      email: adminEmail,
      name: "Admin Teste",
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
      cpf: "12345678901",
      phone: "+5561999887766",
      birthDate: new Date("1985-01-15"),
    },
  });

  const adminHashValid = await validatePasswordHash(adminPassword, admin.passwordHash);
  if (!adminHashValid) {
    console.error(`❌ Hash da senha do ADMIN está inválido!`);
    process.exit(1);
  }

  console.log(`✅ ADMIN criado: ${admin.email}`);
  console.log(`   Senha: ${adminPassword} (hash validado: ✓)`);
  console.log(`   ID: ${admin.id}`);

  // MODELO
  const modeloEmail = "modelo@tna.studio";
  const modeloPassword = "Modelo@2025!";
  const modeloPasswordHash = await bcrypt.hash(modeloPassword, 12);
  const modelo = await prisma.user.upsert({
    where: { email: modeloEmail },
    update: {
      name: "Modelo Teste",
      role: Role.MODELO,
      passwordHash: modeloPasswordHash,
      cpf: "98765432100",
      phone: "+5561999776655",
      birthDate: new Date("1990-05-20"),
    },
    create: {
      email: modeloEmail,
      name: "Modelo Teste",
      role: Role.MODELO,
      passwordHash: modeloPasswordHash,
      cpf: "98765432100",
      phone: "+5561999776655",
      birthDate: new Date("1990-05-20"),
    },
  });

  console.log(`✅ MODELO criado: ${modelo.email}`);
  console.log(`   Senha: ${modeloPassword}`);
  console.log(`   ID: ${modelo.id}`);

  // CLIENTE
  const clienteEmail = "cliente@tna.studio";
  const clientePassword = "Cliente@2025!";
  const clientePasswordHash = await bcrypt.hash(clientePassword, 12);
  const cliente = await prisma.user.upsert({
    where: { email: clienteEmail },
    update: {
      name: "Cliente Teste",
      role: Role.CLIENTE,
      passwordHash: clientePasswordHash,
      cpf: "11122233344",
      phone: "+5561999665544",
      birthDate: new Date("1988-08-10"),
    },
    create: {
      email: clienteEmail,
      name: "Cliente Teste",
      role: Role.CLIENTE,
      passwordHash: clientePasswordHash,
      cpf: "11122233344",
      phone: "+5561999665544",
      birthDate: new Date("1988-08-10"),
    },
  });

  console.log(`✅ CLIENTE criado: ${cliente.email}`);
  console.log(`   Senha: ${clientePassword}`);
  console.log(`   ID: ${cliente.id}`);

  // ============================================
  // 2. APP CONFIG (Singleton)
  // ============================================
  await prisma.appConfig.upsert({
    where: { id: "singleton" },
    update: {
      productionWriteEnabled: true,
      preStartValidationEnabled: true,
      updatedBy: arquiteto.id,
    },
    create: {
      id: "singleton",
      productionWriteEnabled: true,
      preStartValidationEnabled: true,
      updatedBy: arquiteto.id,
    },
  });
  console.log(`\n✅ AppConfig criado/atualizado (singleton)`);

  // ============================================
  // 3. PRODUTOS OFICIAIS (11 itens)
  // ============================================
  console.log("\n📦 Criando/atualizando produtos fotográficos (11 itens)...");
  
  const produtosSeed: Array<{
    nome: string;
    categoria: string;
    precoEuro: number;
    shortDescription: string;
    fullDescription: string;
    isActive: boolean;
    displayOrder?: number;
  }> = [
    {
      nome: "Pacote 1 - Book Sensual",
      categoria: "Book",
      precoEuro: 700.0,
      shortDescription: "Ensaio SENSUAL & NU ARTÍSTICO em estúdio/hotel, até 8h, com 200 fotos.",
      fullDescription: "Adquira um ensaio fotográfico com a temática SENSUAL & NU ARTÍSTICO em estúdio e/ou em um hotel, com duração de até 8 horas. Inclui: até 200 fotos eletrônicas (100 tratadas + 100 em preto e branco); maquiagem profissional; quadro foto tela 90x60 cm; pen drive 16 GB criptografado; link para download disponível por 12 meses.",
      isActive: true,
    },
    {
      nome: "Pacote 2 - Book Fashion",
      categoria: "Book",
      precoEuro: 700.0,
      shortDescription: "Ensaio FASHION em estúdio/hotel, até 8h, com 200 fotos.",
      fullDescription: "Adquira um ensaio fotográfico com a temática FASHION em estúdio e/ou em um hotel, com duração de até 8 horas. Inclui: até 200 fotos eletrônicas (100 tratadas + 100 em preto e branco); maquiagem profissional; quadro foto tela 90x60 cm; pen drive 16 GB criptografado; link para download disponível por 12 meses.",
      isActive: true,
    },
    {
      nome: "Pacote 3 - Diária Fotográfica",
      categoria: "Diária",
      precoEuro: 1000.0,
      shortDescription: "Diária SENSUAL & NU ARTÍSTICO para até 5 pessoas.",
      fullDescription: "Para até 5 pessoas, com temática SENSUAL & NU ARTÍSTICO e duração de até 8 horas. Inclui: até 500 fotos eletrônicas (250 tratadas + 250 em preto e branco); maquiagem para até 5 pessoas; quadro foto tela 90x60 cm; pen drive 16 GB criptografado; link para download disponível por 12 meses.",
      isActive: true,
    },
    {
      nome: "Pacote 4 - Portfólio Eletrônico",
      categoria: "Portfólio",
      precoEuro: 100.0,
      shortDescription: "Estúdio 2h + 10 fotos tratadas.",
      fullDescription: "Sessão de estúdio de até 2 horas, ideal para atualização de portfólio. Inclui: 10 fotos digitais tratadas no Photoshop. Maquiagem não inclusa.",
      isActive: true,
    },
    {
      nome: "Pacote 5 - Ensaio Estúdio + Quadro",
      categoria: "Ensaio",
      precoEuro: 350.0,
      shortDescription: "Estúdio 4h + 100 fotos tratadas + quadro 90x60.",
      fullDescription: "Sessão de estúdio de até 4 horas. Inclui: 100 fotos eletrônicas tratadas; quadro foto tela 90x60 cm. Maquiagem não inclusa.",
      isActive: true,
    },
    {
      nome: "Pacote 6 - Ensaio Externo + Quadro",
      categoria: "Ensaio",
      precoEuro: 350.0,
      shortDescription: "Externa no DF até 4h + 100 fotos tratadas + quadro 90x60.",
      fullDescription: "Sessão de até 4 horas em locação externa no Distrito Federal. Inclui: 100 fotos eletrônicas tratadas; quadro foto tela 90x60 cm. Maquiagem não inclusa.",
      isActive: true,
    },
    {
      nome: "Pacote 7 - Mensalidade Fotográfica",
      categoria: "Mensalidade",
      precoEuro: 75.0,
      shortDescription: "Plano mensal: 1 ensaio/mês + 30 fotos. Contrato 12 meses.",
      fullDescription: "Mensalidade para atualização de portfólio (pessoa física ou jurídica). Contrato mínimo de 12 meses. Inclui: 1 ensaio por mês em estúdio (até 1 hora) com 30 fotos tratadas. Foto adicional: € 1. Maquiagem não inclusa. Limitado a 5 vagas simultâneas por ano.",
      isActive: true,
    },
    {
      nome: "Pacote 8 - Receber uma Cortesia",
      categoria: "Cortesia",
      precoEuro: 0.0,
      shortDescription: "Café + 1 foto tratada gratuitamente.",
      fullDescription: "Venha tomar um café e ganhe uma foto digital tratada. Sessão de 30 a 120 minutos. A melhor foto é sua de graça. Fotos adicionais podem ser adquiridas por € 10 cada. Contrato: Model Release Padrão.",
      isActive: true,
    },
    {
      nome: "Pacote 9 - Marcar uma Entrevista",
      categoria: "Entrevista",
      precoEuro: 0.0,
      shortDescription: "Entrevista presencial ou virtual para conhecer opções.",
      fullDescription: "Encontro virtual ou presencial para apresentação das opções fotográficas, formatos de ensaio e materiais impressos. Atendimento mediante agendamento conforme disponibilidade.",
      isActive: true,
    },
    {
      nome: "Pacote 10 - Permuta (TFP)",
      categoria: "TFP",
      precoEuro: 0.0,
      shortDescription: "Permuta: participação em atividade + 30 fotos tratadas.",
      fullDescription: "Trade For Print (TFP). Participação em atividade (ensaio, aula, workshop ou projeto autoral) com contrapartida de 30 fotos digitais tratadas. Contrato: Model Release Padrão. Multa por quebra de contrato: 10 vezes o valor do Pacote 2.",
      isActive: true,
    },
    {
      nome: "Pacote 11 - Atuar como Modelo Vivo",
      categoria: "Modelo Vivo",
      precoEuro: 0.0,
      shortDescription: "Modelo vivo em estudos artísticos + ensaio adicional.",
      fullDescription: "Participação como modelo vivo em estudos técnicos de nu artístico. Contrapartida: ensaio adicional (tema livre) realizado pelo fotógrafo + 30 fotos do ensaio original. Indicado para quem aprecia o nu artístico como arte.",
      isActive: true,
    },
  ];

  let produtosCriados = 0;
  let produtosAtualizados = 0;

  produtosSeed.forEach((produtoData, index) => {
    produtoData.displayOrder = index + 1;
  });

  for (const produtoData of produtosSeed) {
    const slug = generateSlug(produtoData.nome);
    
    // Verificar se produto já existe
    const produtoExistente = await prisma.produto.findUnique({
      where: { slug },
    });

    const data = {
      nome: produtoData.nome,
      shortDescription: produtoData.shortDescription,
      fullDescription: produtoData.fullDescription,
      precoEuro: produtoData.precoEuro,
      categoria: produtoData.categoria,
      isActive: produtoData.isActive,
      displayOrder: produtoData.displayOrder || 0,
    };

    try {
      const produto = await prisma.produto.upsert({
        where: { slug },
        update: data,
        create: {
          ...data,
          slug,
        },
      });

      if (produtoExistente) {
        produtosAtualizados++;
        console.log(`   ↻ ${produto.nome} (slug: ${produto.slug}) - ATUALIZADO`);
      } else {
        produtosCriados++;
        console.log(`   ✓ ${produto.nome} (slug: ${produto.slug}) - CRIADO`);
      }
    } catch (error: any) {
      console.error(`   ❌ Erro ao criar/atualizar produto "${produtoData.nome}": ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // 4. VALIDAÇÃO DE SUCESSO
  // ============================================
  console.log("\n🔍 Validando integridade do banco...");

  const userCount = await prisma.user.count({ where: { deletedAt: null } });
  const produtoCount = await prisma.produto.count({ where: { deletedAt: null, isActive: true } });
  const appConfigExists = await prisma.appConfig.findUnique({ where: { id: "singleton" } });

  if (userCount < 4) {
    console.error(`❌ VALIDAÇÃO FALHOU: Esperado pelo menos 4 usuários, encontrado ${userCount}`);
    process.exit(1);
  }

  if (produtoCount < 11) {
    console.error(`❌ VALIDAÇÃO FALHOU: Esperado pelo menos 11 produtos, encontrado ${produtoCount}`);
    process.exit(1);
  }

  if (!appConfigExists) {
    console.error(`❌ VALIDAÇÃO FALHOU: AppConfig singleton não encontrado`);
    process.exit(1);
  }

  // Validar login do ARQUITETO
  const arquitetoFromDb = await prisma.user.findUnique({
    where: { email: arquitetoEmail },
    select: { passwordHash: true },
  });

  if (!arquitetoFromDb) {
    console.error(`❌ VALIDAÇÃO FALHOU: ARQUITETO não encontrado no banco`);
    process.exit(1);
  }

  const loginValid = await validatePasswordHash(arquitetoPassword, arquitetoFromDb.passwordHash);
  if (!loginValid) {
    console.error(`❌ VALIDAÇÃO FALHOU: Hash da senha do ARQUITETO não corresponde`);
    process.exit(1);
  }

  console.log(`✅ Validação concluída:`);
  console.log(`   Usuários: ${userCount}`);
  console.log(`   Produtos: ${produtoCount} (11 oficiais)`);
  console.log(`   AppConfig: OK`);
  console.log(`   Login Arquiteto: OK (Validado via script)`);

  // ============================================
  // 5. RESUMO FINAL
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("✅ SEED CONCLUÍDO COM SUCESSO");
  console.log("=".repeat(60));
  console.log(`\n📋 Usuários criados/atualizados: ${userCount}`);
  console.log(`   - ARQUITETO: ${arquitetoEmail} / ${arquitetoPassword}`);
  console.log(`   - ADMIN: ${adminEmail} / ${adminPassword}`);
  console.log(`   - MODELO: ${modeloEmail} / ${modeloPassword}`);
  console.log(`   - CLIENTE: ${clienteEmail} / ${clientePassword}`);
  console.log(`\n📦 Produtos:`);
  console.log(`   - Criados: ${produtosCriados}`);
  console.log(`   - Atualizados: ${produtosAtualizados}`);
  console.log(`   - Total ativo: ${produtoCount} (11 oficiais)`);
  console.log(`\n🔐 Login Arquiteto: OK (Validado via script)`);
  console.log(`\n✅ Sistema pronto para uso.`);
  console.log("=".repeat(60) + "\n");
}

main()
  .catch((error) => {
    console.error("\n❌ ERRO CRÍTICO NO SEED:", error);
    console.error(error.stack);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
