#!/bin/bash

# Script para zerar completamente o banco de dados
# ATENÇÃO: Isso apaga TODOS os dados!

set -e

echo "⚠️  ATENÇÃO: Este script vai APAGAR TODOS os dados do banco!"
echo "Pressione Ctrl+C para cancelar ou Enter para continuar..."
read

echo ""
echo "🔄 Zerando banco de dados..."

# Resetar banco (drop + create + migrate)
npx prisma migrate reset --force --skip-seed

echo ""
echo "✅ Banco zerado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Executar: npm run seed"
echo "2. Testar login com usuários do seed"
echo ""

