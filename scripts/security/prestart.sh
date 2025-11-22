#!/bin/bash

# Script de Validação Pré-Start (Bash Wrapper)
# Este script DEVE ser executado antes de npm run dev
# Força validação completa antes de permitir desenvolvimento

set -e

echo ""
echo "🔐 TNA Studio - Validação Pré-Start"
echo "===================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se está em repositório Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Erro: Não está em um repositório Git${NC}"
    exit 1
fi

# 2. Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Erro: Node.js não encontrado${NC}"
    exit 1
fi

# 3. Verificar se Prisma está instalado
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Erro: npx não encontrado${NC}"
    exit 1
fi

# 4. Definir NODE_ENV=development se não estiver definido (para validação)
export NODE_ENV=${NODE_ENV:-development}

# 5. Regenerar Prisma Client (garantir sincronização)
echo -e "${YELLOW}🔄 Regenerando Prisma Client...${NC}"
npx prisma generate > /dev/null 2>&1 || {
    echo -e "${RED}❌ Erro ao regenerar Prisma Client${NC}"
    exit 1
}

# 6. Executar validação TypeScript
echo -e "${YELLOW}📋 Executando validações...${NC}"
echo ""

# Executa o script TypeScript de validação
VALIDATION_RESULT=$(NODE_ENV=development npx tsx scripts/security/prestart-validator.ts 2>&1)
VALIDATION_EXIT=$?

if [ $VALIDATION_EXIT -ne 0 ]; then
    echo -e "${RED}"
    echo "$VALIDATION_RESULT"
    echo ""
    echo "❌ Validação falhou. Desenvolvimento bloqueado."
    echo ""
    echo "Ações necessárias:"
    echo "  1. Sincronize código: git pull origin main"
    echo "  2. Sincronize migrations: npx prisma migrate deploy"
    echo "  3. Execute este script novamente"
    echo ""
    echo -e "${NC}"
    exit 1
fi

echo -e "${GREEN}"
echo "$VALIDATION_RESULT"
echo ""
echo "✅ Validação concluída com sucesso!"
echo ""
echo -e "${NC}"

# 7. Se passou, permite continuar
echo "🚀 Iniciando servidor de desenvolvimento..."
echo ""

# Executa o comando original (next dev ou o que foi passado)
# Garante que NODE_ENV=development está definido
export NODE_ENV=development
exec "$@"

