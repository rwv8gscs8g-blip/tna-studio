#!/bin/bash
# Script de Consolidação Final - Golden Migration
set -e

cd "$(dirname "$0")/.."

echo "🔄 Passo 1: Removendo migrations antigas..."
rm -rf prisma/migrations
echo "✅ Pasta migrations removida"

echo ""
echo "🔄 Passo 2: Gerando migration init..."
npx prisma migrate dev --name init
echo "✅ Migration init criada"

echo ""
echo "🔄 Passo 3: Fazendo commit..."
git add .
git commit -m "chore: reset migrations to golden init state" || echo "⚠️  Nenhuma mudança para commitar"
git push origin main || echo "⚠️  Push falhou ou não há mudanças"
echo "✅ Commit e push concluídos"

echo ""
echo "✅ Passo 1 concluído com sucesso!"

