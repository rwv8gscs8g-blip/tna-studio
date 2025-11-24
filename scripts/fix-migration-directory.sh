#!/bin/bash
# Script para renomear o diretório de migration com nome inválido

cd "$(dirname "$0")/.." || exit 1

OLD_DIR="prisma/migrations/\$(date +%Y%m%d%H%M%S)_add_produtos_intencoes_loja"
NEW_DIR="prisma/migrations/20250124020000_add_produtos_intencoes_loja"

if [ -d "$OLD_DIR" ]; then
    echo "Renomeando diretório: $OLD_DIR -> $NEW_DIR"
    mv "$OLD_DIR" "$NEW_DIR"
    echo "✅ Diretório renomeado com sucesso"
else
    echo "⚠️  Diretório não encontrado: $OLD_DIR"
    # Tentar encontrar o diretório com padrão diferente
    FOUND=$(find prisma/migrations -maxdepth 1 -type d -name '*date*' -o -name '*\$*' 2>/dev/null | head -1)
    if [ -n "$FOUND" ]; then
        echo "Encontrado: $FOUND"
        mv "$FOUND" "$NEW_DIR"
        echo "✅ Diretório renomeado com sucesso"
    else
        echo "❌ Não foi possível encontrar o diretório para renomear"
        exit 1
    fi
fi

