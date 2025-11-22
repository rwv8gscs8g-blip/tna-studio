#!/bin/bash

# Script de Backup Lógico - TNA Studio
# 
# IMPORTANTE: Este script faz dump lógico do banco PostgreSQL (Neon)
# Os backups devem ser armazenados em local seguro e NUNCA commitados no Git.
#
# Uso:
#   chmod +x scripts/backup/backup-logico.sh
#   ./scripts/backup/backup-logico.sh

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/tna-studio-backup-${TIMESTAMP}.sql"
BACKUP_CHECKSUM="${BACKUP_FILE}.sha256"

echo ""
echo "🔄 Backup Lógico - TNA Studio"
echo "=============================="
echo ""

# 1. Verificar se DATABASE_URL está configurado
if [ -z "$DATABASE_URL" ]; then
    # Tentar carregar de .env.local
    if [ -f .env.local ]; then
        export $(grep -v '^#' .env.local | xargs)
    fi
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Erro: DATABASE_URL não configurado${NC}"
    echo "   Configure DATABASE_URL no .env.local ou como variável de ambiente"
    exit 1
fi

# 2. Criar diretório de backups se não existir
mkdir -p "$BACKUP_DIR"

# 3. Verificar se pg_dump está disponível
if ! command -v pg_dump &> /dev/null; then
    echo -e "${YELLOW}⚠️  pg_dump não encontrado. Tentando instalar via npm...${NC}"
    
    # Tentar usar pg_dump via npx (se disponível)
    if command -v npx &> /dev/null; then
        PG_DUMP_CMD="npx pg-dump"
    else
        echo -e "${RED}❌ pg_dump não disponível. Instale PostgreSQL client tools.${NC}"
        exit 1
    fi
else
    PG_DUMP_CMD="pg_dump"
fi

# 4. Extrair informações da DATABASE_URL
# Formato: postgresql://user:password@host:port/database?sslmode=require
DB_URL="$DATABASE_URL"

# 5. Executar backup
echo -e "${YELLOW}📦 Executando backup...${NC}"
echo "   Arquivo: $BACKUP_FILE"
echo ""

if $PG_DUMP_CMD "$DB_URL" > "$BACKUP_FILE" 2>/dev/null; then
    echo -e "${GREEN}✅ Backup criado com sucesso${NC}"
else
    echo -e "${RED}❌ Erro ao criar backup${NC}"
    exit 1
fi

# 6. Calcular checksum SHA256
echo -e "${YELLOW}🔐 Calculando checksum...${NC}"
if command -v shasum &> /dev/null; then
    shasum -a 256 "$BACKUP_FILE" > "$BACKUP_CHECKSUM"
elif command -v sha256sum &> /dev/null; then
    sha256sum "$BACKUP_FILE" > "$BACKUP_CHECKSUM"
else
    echo -e "${YELLOW}⚠️  Ferramenta de checksum não encontrada. Pulando validação.${NC}"
fi

# 7. Informações do backup
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo ""
echo -e "${GREEN}✅ Backup concluído${NC}"
echo "   Arquivo: $BACKUP_FILE"
echo "   Tamanho: $BACKUP_SIZE"
if [ -f "$BACKUP_CHECKSUM" ]; then
    echo "   Checksum: $BACKUP_CHECKSUM"
    echo "   Hash: $(cat $BACKUP_CHECKSUM | cut -d' ' -f1)"
fi
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   - Backup armazenado em: $BACKUP_DIR"
echo "   - NUNCA commitar backups no Git"
echo "   - Enviar para local seguro (Sync.com, cofre, etc.)"
echo "   - Manter backups por pelo menos 6 meses (conforme GDPR)"
echo ""

# 8. Limpar backups antigos (opcional - manter últimos 10)
if [ -d "$BACKUP_DIR" ]; then
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.sql 2>/dev/null | wc -l | tr -d ' ')
    if [ "$BACKUP_COUNT" -gt 10 ]; then
        echo -e "${YELLOW}🧹 Limpando backups antigos (mantendo últimos 10)...${NC}"
        ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | tail -n +11 | xargs rm -f
        ls -t "$BACKUP_DIR"/*.sha256 2>/dev/null | tail -n +11 | xargs rm -f
        echo -e "${GREEN}✅ Limpeza concluída${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Backup finalizado com sucesso!${NC}"
echo ""

