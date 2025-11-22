#!/bin/bash
#
# Script para ZERAR completamente o banco de dados e recriar do zero
# Mantém apenas o seed do primeiro Arquiteto
#
# ATENÇÃO: Este script apaga TODOS os dados do banco!
#

set -e

echo "⚠️  ATENÇÃO: Este script vai APAGAR TODOS os dados do banco!"
echo "   Pressione Ctrl+C para cancelar, ou Enter para continuar..."
read

echo ""
echo "🔄 Zerando banco de dados..."

# 1. Resetar todas as migrations (dropa e recria o banco)
echo "📦 Resetando migrations..."
npx prisma migrate reset --force --skip-seed

# 2. Aplicar todas as migrations
echo "📦 Aplicando migrations..."
npx prisma migrate deploy

# 3. Gerar Prisma Client
echo "📦 Gerando Prisma Client..."
npx prisma generate

# 4. Rodar seed (cria apenas o primeiro Arquiteto)
echo "🌱 Rodando seed (criando primeiro Arquiteto)..."
npm run seed

echo ""
echo "✅ Banco de dados zerado e recriado!"
echo ""
echo "📋 Usuário criado:"
echo "   Email: [redacted-email]"
echo "   Senha: [redacted-password]"
echo "   Perfil: ARQUITETO"
echo ""
echo "📝 Próximos passos:"
echo "   1. Faça login com as credenciais do Arquiteto"
echo "   2. Use o certificado digital A1 para operações de escrita (se configurado)"
echo "   3. Crie os demais usuários via sistema"
echo ""
