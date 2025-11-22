/**
 * Script para verificar sincronização do banco de dados
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Verificando banco de dados...\n');

    // Contar usuários
    const totalUsers = await prisma.user.count();
    console.log(`📊 Total de usuários: ${totalUsers}`);

    // Listar usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        cpf: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    console.log('\n👥 Usuários:');
    users.forEach(u => {
      console.log(`  - ${u.email} (${u.role}) - CPF: ${u.cpf || 'não informado'}`);
    });

    // Contar galerias
    const totalGalleries = await prisma.gallery.count();
    console.log(`\n📸 Total de galerias: ${totalGalleries}`);

    // Galerias do admin
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@tna.studio' },
      select: { id: true },
    });

    if (adminUser) {
      const adminGalleries = await prisma.gallery.findMany({
        where: { userId: adminUser.id },
        include: {
          User: {
            select: { email: true, name: true },
          },
          _count: {
            select: { Photo: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log(`\n🖼️  Galerias do admin@tna.studio: ${adminGalleries.length}`);
      adminGalleries.forEach(g => {
        console.log(`  - ${g.title} (${g._count.Photo} foto(s))`);
      });
    } else {
      console.log('\n⚠️  Usuário admin@tna.studio não encontrado');
    }

    // Verificar CPFs duplicados
    const cpfs = await prisma.user.findMany({
      where: { cpf: { not: null } },
      select: { email: true, cpf: true },
    });

    const cpfMap = new Map();
    cpfs.forEach(u => {
      if (u.cpf) {
        if (cpfMap.has(u.cpf)) {
          cpfMap.get(u.cpf).push(u.email);
        } else {
          cpfMap.set(u.cpf, [u.email]);
        }
      }
    });

    const duplicates = Array.from(cpfMap.entries()).filter(([_, emails]) => emails.length > 1);
    if (duplicates.length > 0) {
      console.log('\n⚠️  CPFs duplicados encontrados:');
      duplicates.forEach(([cpf, emails]) => {
        console.log(`  - CPF ${cpf}: ${emails.join(', ')}`);
      });
    } else {
      console.log('\n✅ Nenhum CPF duplicado encontrado');
    }

    // Verificar AdminSessions
    const adminSessions = await prisma.adminSession.findMany({
      include: {
        User: {
          select: { email: true, role: true },
        },
      },
    });

    console.log(`\n🔐 Sessões de admin ativas: ${adminSessions.length}`);
    adminSessions.forEach(s => {
      console.log(`  - ${s.User.email} (${s.environment}) - Validado: ${s.preStartValidated ? '✅' : '❌'}`);
    });

    console.log('\n✅ Verificação concluída!\n');

  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

