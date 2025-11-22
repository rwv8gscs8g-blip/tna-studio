#!/bin/bash

# Script para zerar completamente o banco de dados e recriar
# ATENÇÃO: Isso apaga TODOS os dados!

set -e

echo "⚠️  ⚠️  ⚠️  ATENÇÃO: Este script vai APAGAR TODOS os dados do banco! ⚠️  ⚠️  ⚠️"
echo ""
echo "Isso inclui:"
echo "  - Todos os usuários"
echo "  - Todas as galerias"
echo "  - Todas as fotos"
echo "  - Todos os dados administrativos"
echo ""
echo "Pressione Ctrl+C para cancelar ou Enter para continuar..."
read

echo ""
echo "🔄 Iniciando reset completo do banco..."

# 1. Resetar banco (drop + create + migrate)
# Isso apaga TODOS os dados incluindo galerias, fotos, etc.
echo "📋 1. Resetando banco (drop + create + migrate)..."
echo "   Isso vai apagar TODOS os dados: usuários, galerias, fotos, etc."
npx prisma migrate reset --force --skip-seed

# 2. Gerar Prisma Client
echo "📋 2. Gerando Prisma Client..."
npx prisma generate

# 3. Rodar seed
echo "📋 3. Executando seed..."
npm run seed

echo ""
echo "✅ Banco resetado e seed executado com sucesso!"
echo ""
echo "📋 Usuários criados:"
echo "  - super@tna.studio / Super@2025! (SUPER_ADMIN)"
echo "  - admin@tna.studio / Admin@2025! (ADMIN)"
echo "  - model1@tna.studio / Model1@2025! (MODEL)"
echo "  - client1@tna.studio / Client1@2025! (CLIENT)"
echo "  - [redacted-email] / [redacted-password] (SUPER_ADMIN)"
echo ""
echo "🚀 Próximo passo: npm run dev"
echo ""

