import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import forge from "node-forge";
import { createHash } from "crypto";

/**
 * Guard de Proteção de Ambiente - Inline para evitar problemas de importação
 * 
 * Previne execução de seed em produção.
 * Confia exclusivamente em NODE_ENV para determinar o ambiente.
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
 * Seed inicial - Apenas o primeiro Arquiteto
 * 
 * Após zerar o banco, apenas o primeiro arquiteto será criado.
 * Ele criará todos os demais usuários via sistema.
 */

const ARQUITETO_INICIAL = {
  email: "[redacted-email]",
  name: "Luís Maurício Junqueira Zanin",
  password: "[redacted-password]",
  role: Role.ARQUITETO,
  phone: "[redacted-phone]",
  cpf: "[redacted-cpf]",
  passport: null,
  birthDate: new Date("1974-12-27"),
  lgpdAccepted: true,
  gdprAccepted: true,
  termsAccepted: true,
  acceptedAt: new Date(),
};

/**
 * Lê e valida certificado A1 do arquivo
 */
async function readAndValidateCertificate(
  certPath: string,
  certPassword: string
): Promise<{
  serial: string;
  thumbprint: string;
  certificateHash: string;
  certificateEncrypted: string;
  issuer: string;
  validFrom: Date;
  validUntil: Date;
}> {
  if (!existsSync(certPath)) {
    throw new Error(`Certificado não encontrado: ${certPath}`);
  }

  const pfxData = readFileSync(certPath);
  const pfxString = Buffer.from(pfxData).toString("binary");
  const p12Asn1 = forge.asn1.fromDer(pfxString);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certPassword);

  const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = bags[forge.pki.oids.certBag];

  if (!certBag || certBag.length === 0) {
    throw new Error("Nenhum certificado encontrado no arquivo PKCS#12");
  }

  const cert = certBag[0].cert as forge.pki.Certificate;
  const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  const thumbprint = createHash("sha1").update(Buffer.from(certDer, "binary")).digest("hex");
  const certificateHash = createHash("sha256").update(pfxData).digest("hex");
  
  // Em produção real, o certificado seria criptografado
  // Por simplicidade, armazenamos como base64
  const certificateEncrypted = pfxData.toString("base64");

  const issuer = cert.issuer.getField("CN")?.value || cert.issuer.getField("O")?.value || "Unknown";

  return {
    serial: cert.serialNumber,
    thumbprint,
    certificateHash,
    certificateEncrypted,
    issuer,
    validFrom: cert.validity.notBefore,
    validUntil: cert.validity.notAfter,
  };
}

async function main() {
  // Proteção crítica: seed NUNCA deve rodar em produção
  ensureNotProduction("Database Seed");
  
  console.log("🌱 Iniciando seed de usuários...");
  console.log("📋 Criando usuários de teste\n");

  // ============================================
  // ARQUITETO - Administrador principal
  // ============================================
  const birth = new Date(ARQUITETO_INICIAL.birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  if (age < 18) {
    console.error(`❌ ${ARQUITETO_INICIAL.email}: Idade ${age} anos é menor que 18 anos!`);
    process.exit(1);
  }

  const arquitetoPasswordHash = await bcrypt.hash(ARQUITETO_INICIAL.password, 12);
  const arquiteto = await prisma.user.upsert({
    where: { email: ARQUITETO_INICIAL.email },
    update: {
      name: ARQUITETO_INICIAL.name,
      role: Role.ARQUITETO,
      passwordHash: arquitetoPasswordHash,
      phone: ARQUITETO_INICIAL.phone,
      cpf: ARQUITETO_INICIAL.cpf,
      passport: ARQUITETO_INICIAL.passport,
      birthDate: ARQUITETO_INICIAL.birthDate,
      lgpdAccepted: ARQUITETO_INICIAL.lgpdAccepted,
      gdprAccepted: ARQUITETO_INICIAL.gdprAccepted,
      termsAccepted: ARQUITETO_INICIAL.termsAccepted,
      acceptedAt: ARQUITETO_INICIAL.acceptedAt,
    },
    create: {
      email: ARQUITETO_INICIAL.email,
      name: ARQUITETO_INICIAL.name,
      role: Role.ARQUITETO,
      passwordHash: arquitetoPasswordHash,
      phone: ARQUITETO_INICIAL.phone,
      cpf: ARQUITETO_INICIAL.cpf,
      passport: ARQUITETO_INICIAL.passport,
      birthDate: ARQUITETO_INICIAL.birthDate,
      lgpdAccepted: ARQUITETO_INICIAL.lgpdAccepted,
      gdprAccepted: ARQUITETO_INICIAL.gdprAccepted,
      termsAccepted: ARQUITETO_INICIAL.termsAccepted,
      acceptedAt: ARQUITETO_INICIAL.acceptedAt,
    },
  });

  console.log(
    `✅ ${arquiteto.email} (${arquiteto.role}) - CPF: ${arquiteto.cpf}, Telefone: ${arquiteto.phone}, Idade: ${age} anos.`
  );
  console.log(`   Email: ${arquiteto.email}`);
  console.log(`   Senha: ${ARQUITETO_INICIAL.password}`);

  // ============================================
  // ADMIN - Somente leitura
  // ============================================
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
  console.log(`\n✅ ${admin.email} (${admin.role}) - Somente leitura`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Senha: ${adminPassword}`);

  // ============================================
  // MODELO - Somente leitura (exceto auto-cadastro)
  // ============================================
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
  console.log(`\n✅ ${modelo.email} (${modelo.role}) - Somente leitura`);
  console.log(`   Email: ${modelo.email}`);
  console.log(`   Senha: ${modeloPassword}`);

  // ============================================
  // CLIENTE - Somente leitura
  // ============================================
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
  console.log(`\n✅ ${cliente.email} (${cliente.role}) - Somente leitura`);
  console.log(`   Email: ${cliente.email}`);
  console.log(`   Senha: ${clientePassword}`);

  // ============================================
  // SUPERADMIN - Reservado para gestão de certificado (não usado ainda)
  // ============================================
  const superadminEmail = "superadmin@tna.studio";
  const superadminPassword = "SuperAdmin@2025!";
  const superadminPasswordHash = await bcrypt.hash(superadminPassword, 12);
  const superadmin = await prisma.user.upsert({
    where: { email: superadminEmail },
    update: {
      name: "Super Admin",
      role: Role.SUPERADMIN,
      passwordHash: superadminPasswordHash,
      cpf: "55566677788",
      phone: "+5561999554433",
      birthDate: new Date("1980-03-25"),
    },
    create: {
      email: superadminEmail,
      name: "Super Admin",
      role: Role.SUPERADMIN,
      passwordHash: superadminPasswordHash,
      cpf: "55566677788",
      phone: "+5561999554433",
      birthDate: new Date("1980-03-25"),
    },
  });
  console.log(`\n✅ ${superadmin.email} (${superadmin.role}) - Reservado para gestão de certificado`);
  console.log(`   Email: ${superadmin.email}`);
  console.log(`   Senha: ${superadminPassword}`);
  console.log(`   NOTA: Não será usado na interface ainda`);

  // Tentar ler e associar certificado A1 (se configurado)
  // PROTEGIDO: não deve quebrar o seed se a tabela não existir
  const certPath = process.env.CERT_A1_FILE_PATH || "./secrets/certs/assinatura_a1.pfx";
  const certPassword = process.env.CERT_A1_PASSWORD;

  if (certPassword && existsSync(certPath)) {
    try {
      console.log("\n📜 Lendo certificado digital A1...");
      const certData = await readAndValidateCertificate(certPath, certPassword);

      // Criar ou atualizar registro de certificado (protegido contra tabela inexistente)
      try {
        await prisma.adminCertificate.upsert({
        where: { userId: arquiteto.id },
        update: {
          certificateHash: certData.certificateHash,
          certificateEncrypted: certData.certificateEncrypted,
          serialNumber: certData.serial,
          issuer: certData.issuer,
          validFrom: certData.validFrom,
          validUntil: certData.validUntil,
          isActive: true,
          lastUsedAt: null,
          createdBy: arquiteto.id,
        },
        create: {
          userId: arquiteto.id,
          certificateHash: certData.certificateHash,
          certificateEncrypted: certData.certificateEncrypted,
          serialNumber: certData.serial,
          issuer: certData.issuer,
          validFrom: certData.validFrom,
          validUntil: certData.validUntil,
          isActive: true,
          lastUsedAt: null,
          createdBy: arquiteto.id,
        },
      });

        console.log(`✅ Certificado A1 associado ao Arquiteto`);
        console.log(`   Serial: ${certData.serial}`);
        console.log(`   Thumbprint: ${certData.thumbprint}`);
        console.log(`   Válido até: ${certData.validUntil.toISOString()}`);
      } catch (error: any) {
        // Erro P2021: tabela não existe - não é crítico para o seed
        if (error?.code === "P2021" || error?.code === "P1001" || error?.message?.includes("does not exist")) {
          console.warn(`⚠️  Tabela AdminCertificate não existe ainda (${error.code}). Certificado pode ser associado após aplicar migrations.`);
        } else {
          console.warn(`⚠️  Erro ao associar certificado A1: ${error.message}`);
          console.warn(`   O certificado pode ser associado posteriormente via interface do SUPER_ADMIN`);
        }
      }
    } catch (error: any) {
      console.warn(`⚠️  Erro ao ler/validar certificado A1: ${error.message}`);
      console.warn(`   O certificado pode ser associado posteriormente via interface do SUPER_ADMIN`);
    }
  } else {
    console.warn(`\n⚠️  Certificado A1 não encontrado ou não configurado.`);
    console.warn(`   Configure CERT_A1_FILE_PATH e CERT_A1_PASSWORD no .env.local`);
    console.warn(`   O certificado pode ser associado posteriormente via interface do SUPER_ADMIN`);
  }

  // Criar 10 produtos fotográficos
  console.log("\n📦 Criando produtos fotográficos...");
  const produtos = [
    {
      nome: "Pacote 1 - Ensaio Básico",
      descricao: "Ensaio fotográfico básico com 10 fotos editadas em alta resolução. Ideal para iniciantes ou ensaios casuais.",
      preco: 500.0,
      categoria: "Pacote",
      isPromocao: false,
      isTfp: false,
    },
    {
      nome: "Pacote 2 - Ensaio Completo",
      descricao: "Ensaio fotográfico completo com 20 fotos editadas em alta resolução. Inclui diferentes looks e cenários.",
      preco: 900.0,
      categoria: "Pacote",
      isPromocao: false,
      isTfp: false,
    },
    {
      nome: "Pacote 3 - Ensaio Premium",
      descricao: "Ensaio fotográfico premium com 30 fotos editadas em alta resolução. Inclui book profissional completo.",
      preco: 1500.0,
      categoria: "Pacote",
      isPromocao: false,
      isTfp: false,
    },
    {
      nome: "Pacote 4 - Ensaio Fashion",
      descricao: "Ensaio fashion com 25 fotos editadas. Foco em moda e editorial. Ideal para portfólio profissional.",
      preco: 1800.0,
      categoria: "Pacote",
      isPromocao: false,
      isTfp: false,
    },
    {
      nome: "Pacote 5 - Ensaio Boudoir",
      descricao: "Ensaio boudoir intimista com 20 fotos editadas. Ambiente reservado e profissional.",
      preco: 2000.0,
      categoria: "Pacote",
      isPromocao: false,
      isTfp: false,
    },
    {
      nome: "Pacote 6 - Ensaio Externo",
      descricao: "Ensaio em locação externa com 25 fotos editadas. Natureza, urbano ou praia.",
      preco: 2200.0,
      categoria: "Pacote",
      isPromocao: false,
      isTfp: false,
    },
    {
      nome: "Pacote 7 - Ensaio Corporativo",
      descricao: "Ensaio corporativo profissional com 15 fotos editadas. Ideal para LinkedIn e materiais profissionais.",
      preco: 1200.0,
      categoria: "Pacote",
      isPromocao: false,
      isTfp: false,
    },
    {
      nome: "Pacote 8 - Ensaio Artístico",
      descricao: "Ensaio artístico conceitual com 30 fotos editadas. Foco em criatividade e expressão artística.",
      preco: 2500.0,
      categoria: "Pacote",
      isPromocao: false,
      isTfp: false,
    },
    {
      nome: "Pacote 9 - Ensaio VIP",
      descricao: "Ensaio VIP exclusivo com 40 fotos editadas. Inclui múltiplos looks, locações e tratamento premium.",
      preco: 3500.0,
      categoria: "Pacote",
      isPromocao: true,
      isTfp: false,
    },
    {
      nome: "Pacote 10 - TFP / Permuta",
      descricao: "Ensaio TFP (Time For Print) / Permuta. Você recebe as fotos editadas em troca da autorização de uso de imagem para fins comerciais e artísticos. Ideal para modelos que querem expandir seu portfólio.",
      preco: 0.0,
      categoria: "TFP",
      isPromocao: true,
      isTfp: true,
    },
  ];

  for (const produtoData of produtos) {
    const produto = await prisma.produto.upsert({
      where: { nome: produtoData.nome },
      update: produtoData,
      create: produtoData,
    });
    console.log(`   ✓ ${produto.nome}`);
  }

  console.log("\n✅ Seed de usuários e produtos finalizado!");
  console.log(`\n📋 Resumo de usuários criados:`);
  console.log(`   ARQUITETO: ${arquiteto.email} / ${ARQUITETO_INICIAL.password}`);
  console.log(`   ADMIN: ${admin.email} / ${adminPassword}`);
  console.log(`   MODELO: ${modelo.email} / ${modeloPassword}`);
  console.log(`   CLIENTE: ${cliente.email} / ${clientePassword}`);
  console.log(`   SUPERADMIN: ${superadmin.email} / ${superadminPassword} (reservado)`);
  console.log(`\n📦 Produtos criados: 10 pacotes fotográficos`);
  console.log(`\n📝 Nota: Todos os papéis exceto ARQUITETO são somente leitura.`);
  console.log(`   Somente ARQUITETO pode criar, alterar ou excluir dados no sistema.`);
}

main()
  .catch((error) => {
    console.error("❌ Erro no seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
