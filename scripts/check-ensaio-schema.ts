/**
 * Script para verificar se as colunas de Ensaio e EnsaioPhoto existem no banco
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    console.log("🔍 Verificando schema do banco...\n");

    // Verificar colunas da tabela Ensaio
    const ensaioColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Ensaio'
      ORDER BY column_name;
    `;

    console.log("📋 Colunas da tabela 'Ensaio':");
    ensaioColumns.forEach(col => {
      console.log(`  - ${col.column_name}`);
    });

    // Verificar colunas específicas
    const requiredEnsaioColumns = ['coverImageKey', 'termPdfKey', 'syncFolderUrl'];
    const existingEnsaioColumns = ensaioColumns.map(col => col.column_name);
    
    console.log("\n✅ Verificando colunas obrigatórias em 'Ensaio':");
    requiredEnsaioColumns.forEach(col => {
      if (existingEnsaioColumns.includes(col)) {
        console.log(`  ✓ ${col} existe`);
      } else {
        console.log(`  ✗ ${col} NÃO existe`);
      }
    });

    // Verificar colunas da tabela EnsaioPhoto
    const ensaioPhotoColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'EnsaioPhoto'
      ORDER BY column_name;
    `;

    console.log("\n📋 Colunas da tabela 'EnsaioPhoto':");
    ensaioPhotoColumns.forEach(col => {
      console.log(`  - ${col.column_name}`);
    });

    // Verificar coluna específica
    const requiredPhotoColumn = 'storageKey';
    const existingPhotoColumns = ensaioPhotoColumns.map(col => col.column_name);
    
    console.log("\n✅ Verificando coluna obrigatória em 'EnsaioPhoto':");
    if (existingPhotoColumns.includes(requiredPhotoColumn)) {
      console.log(`  ✓ ${requiredPhotoColumn} existe`);
    } else {
      console.log(`  ✗ ${requiredPhotoColumn} NÃO existe`);
    }

    // Resumo
    console.log("\n📊 Resumo:");
    const missingEnsaio = requiredEnsaioColumns.filter(col => !existingEnsaioColumns.includes(col));
    const missingPhoto = existingPhotoColumns.includes(requiredPhotoColumn) ? [] : [requiredPhotoColumn];
    
    if (missingEnsaio.length === 0 && missingPhoto.length === 0) {
      console.log("  ✅ Todas as colunas obrigatórias existem no banco!");
    } else {
      console.log("  ⚠️ Colunas faltando:");
      missingEnsaio.forEach(col => console.log(`    - Ensaio.${col}`));
      missingPhoto.forEach(col => console.log(`    - EnsaioPhoto.${col}`));
      console.log("\n  💡 Execute: npx prisma migrate dev --name add_ensaio_keys_columns");
    }

  } catch (error: any) {
    console.error("❌ Erro ao verificar schema:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();

