#!/bin/bash
# Script de Sincronização Git Automática
# 
# Uso: ./scripts/git-sync.sh "mensagem de commit"
# Se nenhuma mensagem for fornecida, usa mensagem padrão

set -e

MSG="${1:-chore: auto-sync from cursor}"

echo "🚀 [Git Sync] Iniciando sincronização..."
echo "   Mensagem: $MSG"
echo ""

# Verificar status
echo "📊 [Git Sync] Verificando status..."
git status --short

echo ""
echo "📦 [Git Sync] Adicionando arquivos..."
git add .

echo "💾 [Git Sync] Criando commit..."
git commit --allow-empty -m "$MSG"

echo "📤 [Git Sync] Enviando para origin/main..."
git push origin main

echo ""
echo "✅ [Git Sync] Sucesso!"
echo "   Commit: $MSG"
echo "   Branch: main"

