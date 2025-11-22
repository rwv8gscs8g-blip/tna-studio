/**
 * Script para marcar AdminSessions como validadas
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminSessions() {
  try {
    console.log('🔧 Corrigindo AdminSessions...\n');

    const updated = await prisma.adminSession.updateMany({
      where: {
        preStartValidated: false,
      },
      data: {
        preStartValidated: true,
        lastValidatedAt: new Date(),
      },
    });

    console.log(`✅ ${updated.count} sessão(ões) marcada(s) como validada(s)\n`);

    // Verificar
    const sessions = await prisma.adminSession.findMany({
      include: {
        User: {
          select: { email: true, role: true },
        },
      },
    });

    console.log('📋 Sessões ativas:');
    sessions.forEach(s => {
      console.log(`  - ${s.User.email} (${s.environment}) - Validado: ${s.preStartValidated ? '✅' : '❌'}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminSessions();

