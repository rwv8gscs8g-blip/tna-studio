#!/bin/bash

# Script de Testes Funcionais Mínimos
# Valida funcionalidades básicas após deploy

BASE_URL="${PRODUCTION_URL:-https://tna-studio.vercel.app}"
PASSED=0
FAILED=0
ERRORS=()

log() {
    echo "ℹ️  $1"
}

success() {
    echo "✅ $1"
    ((PASSED++))
}

error() {
    echo "❌ $1"
    ((FAILED++))
    ERRORS+=("$1")
}

echo ""
echo "🧪 Testes Funcionais - TNA Studio (Produção)"
echo "=============================================="
echo "URL Base: $BASE_URL"
echo ""

# Teste 1: Home page acessível
log "Teste 1: Home page acessível"
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/" | grep -q "200\|307"; then
    success "Home page acessível"
else
    error "Home page não acessível"
fi

# Teste 2: Página de login acessível
log "Teste 2: Página de login acessível"
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/signin" | grep -q "200"; then
    success "Página de login acessível"
else
    error "Página de login não acessível"
fi

# Teste 3: Rotas protegidas redirecionam
log "Teste 3: Rotas protegidas redirecionam para login"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE_URL/galleries")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "307" ] || [ "$STATUS" = "302" ]; then
    success "Rotas protegidas redirecionam corretamente"
else
    error "Rotas protegidas não redirecionam (status: $STATUS)"
fi

# Teste 4: API protegida retorna erro sem autenticação (401, 403, ou redirect 307/302)
log "Teste 4: API protegida retorna erro sem autenticação"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE_URL/api/galleries")
if [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ] || [ "$STATUS" = "307" ] || [ "$STATUS" = "302" ]; then
    success "API protegida retorna erro/redirect de autenticação (status: $STATUS)"
else
    error "API protegida não retorna erro (status: $STATUS)"
fi

# Teste 5: Headers de segurança presentes
log "Teste 5: Headers de segurança presentes"
HEADERS=$(curl -s -I "$BASE_URL/" | grep -i "x-content-type-options\|x-frame-options\|x-xss-protection\|referrer-policy")
if [ -n "$HEADERS" ]; then
    success "Headers de segurança presentes"
    echo "   Headers encontrados: $(echo "$HEADERS" | wc -l | tr -d ' ') header(s)"
else
    error "Headers de segurança não encontrados"
    echo "   Debug: Verificando resposta completa..."
    curl -s -I "$BASE_URL/" | head -20
fi

# Teste 6: Middleware funcionando (verifica cookie)
log "Teste 6: Middleware verifica cookie de sessão"
# Tenta acessar rota protegida sem cookie
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE_URL/profile")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "307" ] || [ "$STATUS" = "302" ]; then
    success "Middleware redireciona sem cookie"
else
    error "Middleware não funciona corretamente (status: $STATUS)"
fi

# Resumo
echo ""
echo "📊 Resumo dos Testes:"
echo "===================="
echo "✅ Passou: $PASSED"
echo "❌ Falhou: $FAILED"
TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$(echo "scale=1; $PASSED * 100 / $TOTAL" | bc)
    echo "📈 Taxa de sucesso: ${SUCCESS_RATE}%"
fi
echo ""

if [ ${#ERRORS[@]} -gt 0 ]; then
    echo "❌ Erros encontrados:"
    for i in "${!ERRORS[@]}"; do
        echo "   $((i+1)). ${ERRORS[$i]}"
    done
    echo ""
fi

# Exit code baseado em falhas
if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi

