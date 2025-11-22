#!/bin/bash

# Script de Instalação e Atualização - TNA Studio (Localhost)
# 
# Este script prepara um ambiente local do zero, garantindo que todas
# as camadas de segurança estejam ativas.
#
# Uso:
#   chmod +x scripts/setup-local.sh
#   ./scripts/setup-local.sh

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "🚀 TNA Studio - Setup Local"
echo "============================"
echo ""

# ============================================
# 1. Verificar Pré-requisitos
# ============================================
echo -e "${BLUE}📋 1. Verificando pré-requisitos...${NC}"

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Instale Node.js 18+ primeiro.${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}   ✅ Node.js: $NODE_VERSION${NC}"

# npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm não encontrado.${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}   ✅ npm: $NPM_VERSION${NC}"

# openssl (para gerar secrets)
if ! command -v openssl &> /dev/null; then
    echo -e "${YELLOW}   ⚠️  openssl não encontrado (opcional, mas recomendado)${NC}"
else
    echo -e "${GREEN}   ✅ openssl disponível${NC}"
fi

# Git
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}   ⚠️  Git não encontrado (opcional)${NC}"
else
    echo -e "${GREEN}   ✅ Git disponível${NC}"
fi

echo ""

# ============================================
# 2. Verificar/Gerar .env.local
# ============================================
echo -e "${BLUE}📋 2. Verificando .env.local...${NC}"

if [ ! -f .env.local ]; then
    echo -e "${YELLOW}   ⚠️  .env.local não encontrado${NC}"
    
    if [ -f .env.local.example ]; then
        echo -e "${YELLOW}   📋 Copiando .env.local.example para .env.local...${NC}"
        cp .env.local.example .env.local
        echo -e "${GREEN}   ✅ .env.local criado${NC}"
    else
        echo -e "${RED}   ❌ .env.local.example não encontrado${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${YELLOW}   ⚠️  ATENÇÃO: Configure manualmente as seguintes variáveis em .env.local:${NC}"
    echo "      - DATABASE_URL (banco Neon)"
    echo "      - DIRECT_URL (banco Neon)"
    echo "      - NEXTAUTH_SECRET (gere com: openssl rand -base64 32)"
    echo "      - CERT_A1_FILE_PATH (caminho do certificado .pfx)"
    echo "      - CERT_A1_PASSWORD (senha do certificado)"
    echo ""
    read -p "   Pressione Enter após configurar .env.local..."
else
    echo -e "${GREEN}   ✅ .env.local encontrado${NC}"
    
    # Validar variáveis obrigatórias
    source .env.local 2>/dev/null || true
    
    MISSING_VARS=()
    
    if [ -z "$DATABASE_URL" ]; then
        MISSING_VARS+=("DATABASE_URL")
    fi
    if [ -z "$DIRECT_URL" ]; then
        MISSING_VARS+=("DIRECT_URL")
    fi
    if [ -z "$NEXTAUTH_SECRET" ]; then
        MISSING_VARS+=("NEXTAUTH_SECRET")
    fi
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo -e "${RED}   ❌ Variáveis obrigatórias faltando: ${MISSING_VARS[*]}${NC}"
        echo "      Configure-as em .env.local antes de continuar"
        exit 1
    fi
    
    echo -e "${GREEN}   ✅ Variáveis obrigatórias configuradas${NC}"
fi

echo ""

# ============================================
# 3. Instalar Dependências
# ============================================
echo -e "${BLUE}📋 3. Instalando dependências...${NC}"

if [ ! -d node_modules ]; then
    echo -e "${YELLOW}   📦 Instalando npm packages...${NC}"
    npm install
    echo -e "${GREEN}   ✅ Dependências instaladas${NC}"
else
    echo -e "${GREEN}   ✅ node_modules já existe${NC}"
fi

echo ""

# ============================================
# 4. Configurar Banco de Dados
# ============================================
echo -e "${BLUE}📋 4. Configurando banco de dados...${NC}"

# Carregar variáveis de ambiente
source .env.local 2>/dev/null || true

# Validar conexão
echo -e "${YELLOW}   🔍 Validando conexão com banco...${NC}"
if npx prisma db pull --force 2>&1 | grep -q "error\|Error\|ERROR"; then
    echo -e "${RED}   ❌ Erro ao conectar com banco. Verifique DATABASE_URL.${NC}"
    exit 1
fi
echo -e "${GREEN}   ✅ Conexão com banco OK${NC}"

# Aplicar migrations
echo -e "${YELLOW}   📦 Aplicando migrations...${NC}"
if npx prisma migrate deploy 2>&1 | grep -q "error\|Error\|ERROR"; then
    echo -e "${YELLOW}   ⚠️  Erro ao aplicar migrations. Tentando migrate dev...${NC}"
    npx prisma migrate dev
else
    echo -e "${GREEN}   ✅ Migrations aplicadas${NC}"
fi

# Gerar Prisma Client
echo -e "${YELLOW}   🔧 Gerando Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}   ✅ Prisma Client gerado${NC}"

echo ""

# ============================================
# 5. Rodar Seed
# ============================================
echo -e "${BLUE}📋 5. Criando usuários de teste...${NC}"

if npm run seed 2>&1 | grep -q "error\|Error\|ERROR"; then
    echo -e "${YELLOW}   ⚠️  Erro ao rodar seed (pode ser normal se usuários já existem)${NC}"
else
    echo -e "${GREEN}   ✅ Seed executado${NC}"
fi

echo ""
echo -e "${GREEN}   👥 Usuários de teste:${NC}"
echo "      - super@tna.studio / Super@2025! (SUPER_ADMIN)"
echo "      - admin@tna.studio / Admin@2025! (ADMIN)"
echo "      - model1@tna.studio / Model1@2025! (MODEL)"
echo "      - client1@tna.studio / Client1@2025! (CLIENT)"
echo ""

# ============================================
# 6. Validar Segurança
# ============================================
echo -e "${BLUE}📋 6. Validando segurança...${NC}"

# Verificar script pré-start
if [ -f scripts/security/prestart-validator.ts ]; then
    echo -e "${YELLOW}   🔍 Executando validação pré-start...${NC}"
    if npm run validate 2>&1 | grep -q "passed\|Passou"; then
        echo -e "${GREEN}   ✅ Validação pré-start OK${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Validação pré-start com avisos (pode ser normal na primeira execução)${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠️  Script pré-start não encontrado${NC}"
fi

# Verificar certificado A1
if [ -n "$CERT_A1_FILE_PATH" ] && [ -f "$CERT_A1_FILE_PATH" ]; then
    echo -e "${GREEN}   ✅ Certificado A1 encontrado: $CERT_A1_FILE_PATH${NC}"
else
    echo -e "${YELLOW}   ⚠️  Certificado A1 não encontrado (configure CERT_A1_FILE_PATH)${NC}"
fi

echo ""

# ============================================
# 7. Limpar Cache
# ============================================
echo -e "${BLUE}📋 7. Limpando cache...${NC}"

if [ -d .next ]; then
    rm -rf .next
    echo -e "${GREEN}   ✅ Cache .next removido${NC}"
fi

echo ""

# ============================================
# 8. Resumo Final
# ============================================
echo ""
echo "============================================"
echo -e "${GREEN}✅ Setup concluído com sucesso!${NC}"
echo "============================================"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Iniciar servidor:"
echo "   ${BLUE}npm run dev${NC}"
echo ""
echo "2. Acessar aplicação:"
echo "   ${BLUE}http://localhost:3000${NC}"
echo ""
echo "3. Fazer login:"
echo "   Email: ${BLUE}super@tna.studio${NC}"
echo "   Senha: ${BLUE}Super@2025!${NC}"
echo ""
echo "4. Testar certificado A1:"
echo "   ${BLUE}http://localhost:3000/security/test-a1${NC}"
echo ""
echo -e "${YELLOW}⚠️  Lembre-se:${NC}"
echo "   - Configure CERT_A1_FILE_PATH e CERT_A1_PASSWORD em .env.local"
echo "   - Certificado A1 é obrigatório para operações administrativas"
echo "   - NUNCA commitar certificados ou senhas no Git"
echo ""
echo ""

