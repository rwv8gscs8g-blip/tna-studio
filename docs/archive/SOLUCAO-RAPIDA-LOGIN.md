# 🚨 Solução Rápida - Problema de Login

## Problema Identificado

Seu `.env.local` está faltando as variáveis **OBRIGATÓRIAS** para o login funcionar.

## ✅ Solução Imediata

### 1. Adicionar Variáveis Obrigatórias ao `.env.local`

Abra o arquivo `.env.local` e adicione estas variáveis **OBRIGATÓRIAS**:

```env
# ============================================
# BANCO DE DADOS (OBRIGATÓRIO)
# ============================================
# Substitua pelos seus dados reais do Neon PostgreSQL
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host:port/database?sslmode=require"

# ============================================
# AUTENTICAÇÃO (OBRIGATÓRIO)
# ============================================
# Gere um novo secret: openssl rand -base64 32
NEXTAUTH_SECRET="cole_aqui_o_secret_gerado"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true

# ============================================
# MÓDULO DE TESTES (já está configurado)
# ============================================
SECURITY_TEST_MODE=true
CERT_A1_FILE_PATH=./secrets/certs/assinatura_a1.pfx
CERT_A1_PASSWORD=fortune-ferris-nav-dirty
CERT_A1_OWNER_NAME="Luís Maurício Junqueira Zanin"
```

### 2. Gerar NEXTAUTH_SECRET

Execute no terminal:

```bash
openssl rand -base64 32
```

Copie o resultado e cole no `.env.local` como valor de `NEXTAUTH_SECRET`.

### 3. Configurar Banco de Dados

**Se você já tem um banco Neon:**

1. Acesse o dashboard do Neon
2. Copie a `DATABASE_URL` completa
3. Cole no `.env.local` como `DATABASE_URL` e `DIRECT_URL`

**Se você ainda não tem banco:**

1. Crie uma conta no Neon: https://neon.tech
2. Crie um novo projeto
3. Copie a `DATABASE_URL` fornecida
4. Cole no `.env.local`

### 4. Aplicar Migrations

```bash
# Aplicar migrations no banco
npx prisma migrate dev

# Gerar Prisma Client
npx prisma generate
```

### 5. Criar Usuário de Teste

```bash
# Rodar seed (cria usuários de teste)
npm run seed
```

**Usuários criados pelo seed:**
- Email: `admin@tna.studio` / Senha: `Admin@2025!`
- Email: `model1@tna.studio` / Senha: `Model1@2025!`
- Email: `client1@tna.studio` / Senha: `Client1@2025!`

### 6. Reiniciar Servidor

```bash
# Parar servidor (Ctrl+C se estiver rodando)
# Reiniciar
npm run dev
```

### 7. Tentar Login Novamente

1. Acesse: `http://localhost:3000/signin`
2. Use: `admin@tna.studio` / `Admin@2025!`
3. Após login, acesse: `http://localhost:3000/security/test-a1`

## 🔍 Verificação

### Verificar se variáveis estão carregadas:

```bash
# No terminal, dentro do projeto
node -e "require('dotenv').config({ path: '.env.local' }); console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurado' : '❌ Faltando'); console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Configurado' : '❌ Faltando');"
```

### Verificar conexão com banco:

```bash
npx prisma db pull
```

Se funcionar, o banco está acessível.

### Verificar se usuário existe:

```bash
npx prisma studio
```

Abra o navegador e verifique a tabela `User`.

## ⚠️ Erros Comuns

### "Cannot connect to database"
- Verifique se `DATABASE_URL` está correto
- Verifique se o banco está acessível (firewall, IP whitelist)
- Verifique se `DIRECT_URL` está configurado

### "NEXTAUTH_SECRET is missing"
- Gere um novo secret: `openssl rand -base64 32`
- Adicione ao `.env.local`

### "Invalid credentials"
- Verifique se o usuário existe no banco
- Execute `npm run seed` para criar usuários de teste
- Verifique se a senha está correta

### "Redirect loop"
- Limpe cookies do navegador
- Verifique se `NEXTAUTH_URL` está correto
- Verifique se `AUTH_TRUST_HOST=true` está configurado

## 📋 Checklist Final

Antes de tentar login novamente, verifique:

- [ ] `DATABASE_URL` configurado e válido
- [ ] `DIRECT_URL` configurado e válido
- [ ] `NEXTAUTH_SECRET` configurado (gerado com openssl)
- [ ] `NEXTAUTH_URL` configurado (`http://localhost:3000`)
- [ ] `AUTH_TRUST_HOST=true` configurado
- [ ] Migrations aplicadas (`npx prisma migrate dev`)
- [ ] Prisma Client gerado (`npx prisma generate`)
- [ ] Usuários criados (`npm run seed`)
- [ ] Servidor reiniciado após mudanças no `.env.local`

---

**Se ainda não funcionar**, copie os erros do console do servidor e do navegador para debug.

