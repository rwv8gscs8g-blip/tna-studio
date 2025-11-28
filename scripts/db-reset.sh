#!/bin/bash

# Script de Reset do Banco de Dados - TNA-Studio V2
# Limpa o banco, aplica migrations e roda o seed

set -e

echo "🔄 Iniciando reset do banco de dados..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
  echo "❌ Erro: Execute este script na raiz do projeto"
  exit 1
fi

# Verificar se DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  Aviso: DATABASE_URL não está configurada"
  echo "   Certifique-se de ter um arquivo .env.local com DATABASE_URL"
  read -p "   Continuar mesmo assim? (s/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    exit 1
  fi
fi

echo "📦 Gerando Prisma Client..."
npx prisma generate

echo "🗑️  Resetando banco de dados (isso vai apagar TODOS os dados)..."
read -p "   Tem certeza? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
  echo "❌ Operação cancelada"
  exit 1
fi

echo "🔄 Executando migrate reset..."
npx prisma migrate reset --force

echo "🌱 Executando seed..."
npm run seed

echo "✅ Reset concluído com sucesso!"
echo ""
echo "📋 Credenciais padrão:"
echo "   ARQUITETO: arquiteto@tna.studio / Arquiteto@2025!"
echo "   ADMIN: admin@tna.studio / Admin@2025!"
echo "   MODELO: modelo@tna.studio / Modelo@2025!"
echo "   CLIENTE: cliente@tna.studio / Cliente@2025!"

