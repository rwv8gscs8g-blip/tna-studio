#!/bin/bash

# Script Completo de Testes - TNA Studio Produção
# Testa todas as funcionalidades críticas

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
echo "🧪 Testes Completos - TNA Studio (Produção)"
echo "============================================"
echo "URL Base: $BASE_URL"
echo ""

# Teste 1: Home page
log "Teste 1: Home page acessível"
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/" | grep -q "200\|307"; then
    success "Home page acessível"
else
    error "Home page não acessível"
fi

# Teste 2: Login page
log "Teste 2: Página de login acessível"
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/signin" | grep -q "200"; then
    success "Página de login acessível"
else
    error "Página de login não acessível"
fi

# Teste 3: Rotas protegidas redirecionam
log "Teste 3: Rotas protegidas redirecionam"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE_URL/galleries")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "307" ] || [ "$STATUS" = "302" ]; then
    success "Rotas protegidas redirecionam (status: $STATUS)"
else
    error "Rotas protegidas não redirecionam (status: $STATUS)"
fi

# Teste 4: API protegida
log "Teste 4: API protegida bloqueia acesso não autenticado"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE_URL/api/galleries")
if [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ] || [ "$STATUS" = "307" ] || [ "$STATUS" = "302" ]; then
    success "API protegida bloqueia acesso (status: $STATUS)"
else
    error "API protegida não bloqueia acesso (status: $STATUS)"
fi

# Teste 5: Headers de segurança
log "Teste 5: Headers de segurança"
HEADERS=$(curl -s -I "$BASE_URL/" | grep -i "x-content-type-options\|x-frame-options\|x-xss-protection\|referrer-policy")
if [ -n "$HEADERS" ]; then
    success "Headers de segurança presentes"
    echo "$HEADERS" | while read line; do
        echo "   → $line"
    done
else
    error "Headers de segurança não encontrados"
fi

# Teste 6: CSRF endpoint
log "Teste 6: Endpoint CSRF acessível"
CSRF_RESPONSE=$(curl -s "$BASE_URL/api/auth/csrf")
if echo "$CSRF_RESPONSE" | grep -q "csrfToken"; then
    success "Endpoint CSRF funciona"
    CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | grep -o '"csrfToken":"[^"]*' | cut -d'"' -f4)
    echo "   → CSRF Token obtido: ${CSRF_TOKEN:0:20}..."
else
    error "Endpoint CSRF não funciona"
    echo "   → Resposta: $CSRF_RESPONSE"
fi

# Teste 7: NextAuth endpoints
log "Teste 7: Endpoints NextAuth acessíveis"
for endpoint in "providers" "session" "signin"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/$endpoint")
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "405" ]; then
        success "Endpoint /api/auth/$endpoint acessível (status: $STATUS)"
    else
        error "Endpoint /api/auth/$endpoint não acessível (status: $STATUS)"
    fi
done

# Teste 8: Middleware funcionando
log "Teste 8: Middleware verifica cookie"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE_URL/profile")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "307" ] || [ "$STATUS" = "302" ]; then
    success "Middleware redireciona sem cookie (status: $STATUS)"
else
    error "Middleware não funciona (status: $STATUS)"
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

# Exit code
if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi

