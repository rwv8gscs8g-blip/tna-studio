# Scripts de Teste - TNA Studio

## Scripts Disponíveis

### 1. test-auth-production.js

Testa autenticação e acesso a rotas protegidas.

**Uso:**
```bash
node scripts/test-auth-production.js
```

**Variáveis de ambiente:**
- `PRODUCTION_URL` - URL base (padrão: https://tna-studio.vercel.app)

**O que testa:**
- Login de cada usuário (Admin, Modelo, Cliente)
- Acesso a rotas protegidas após login
- Acesso negado sem autenticação

### 2. test-functional.sh

Testa funcionalidades básicas do sistema.

**Uso:**
```bash
./scripts/test-functional.sh
```

**Variáveis de ambiente:**
- `PRODUCTION_URL` - URL base (padrão: https://tna-studio.vercel.app)

**O que testa:**
- Home page acessível
- Página de login acessível
- Rotas protegidas redirecionam
- APIs protegidas retornam 401
- Headers de segurança presentes
- Middleware funcionando

## Executar Todos os Testes

```bash
# Testes de autenticação
node scripts/test-auth-production.js

# Testes funcionais
./scripts/test-functional.sh
```

## Requisitos

- Node.js 18+ (para test-auth-production.js)
- curl (para test-functional.sh)
- Acesso à internet (para testar produção)
