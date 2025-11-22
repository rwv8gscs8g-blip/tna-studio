# Guia de Configuração - Variáveis de Ambiente

## 🚨 Problema: Não está logando / Redireciona para login

Se você está sendo redirecionado para a página de login mesmo após tentar fazer login, verifique:

### 1. Variáveis Obrigatórias para Login

**Mínimo necessário para o login funcionar:**

```env
# BANCO DE DADOS (OBRIGATÓRIO)
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host:port/database?sslmode=require"

# AUTENTICAÇÃO (OBRIGATÓRIO)
NEXTAUTH_SECRET="seu_secret_aqui"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true
```

### 2. Verificar Banco de Dados

**Passo 1: Verificar se DATABASE_URL está correto**

```bash
# Testar conexão com o banco
npx prisma db pull
```

**Passo 2: Verificar se migrations foram aplicadas**

```bash
# Verificar status das migrations
npx prisma migrate status

# Se necessário, aplicar migrations
npx prisma migrate dev
```

**Passo 3: Verificar se Prisma Client está gerado**

```bash
# Gerar Prisma Client
npx prisma generate
```

### 3. Verificar NEXTAUTH_SECRET

**Gerar um novo secret:**

```bash
openssl rand -base64 32
```

**Adicionar ao `.env.local`:**

```env
NEXTAUTH_SECRET="o_secret_gerado_aqui"
```

### 4. Verificar se há usuários no banco

**Criar usuário de teste (se não existir):**

```bash
# Rodar seed (cria usuários de teste)
npm run seed
```

**Ou criar manualmente via Prisma Studio:**

```bash
npx prisma studio
```

### 5. Verificar Console do Navegador

Abra o console do navegador (F12) e verifique:
- Erros de rede (404, 500, etc.)
- Erros de autenticação
- Cookies sendo criados

### 6. Verificar Logs do Servidor

No terminal onde está rodando `npm run dev`, verifique:
- Erros de conexão com banco
- Erros de autenticação
- Erros de Prisma

## 📋 Checklist Completo

### Variáveis de Ambiente (`.env.local`)

- [ ] `DATABASE_URL` configurado e válido
- [ ] `DIRECT_URL` configurado e válido
- [ ] `NEXTAUTH_SECRET` configurado (gerado com `openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` configurado (`http://localhost:3000` para dev)
- [ ] `AUTH_TRUST_HOST=true` configurado

### Banco de Dados

- [ ] Conexão com banco funciona (`npx prisma db pull`)
- [ ] Migrations aplicadas (`npx prisma migrate status`)
- [ ] Prisma Client gerado (`npx prisma generate`)
- [ ] Há pelo menos um usuário no banco (admin@tna.studio)

### Servidor

- [ ] Servidor está rodando (`npm run dev`)
- [ ] Sem erros no console do servidor
- [ ] Porta 3000 está livre

### Navegador

- [ ] Cookies não estão bloqueados
- [ ] Não está em modo privado/incógnito
- [ ] Console do navegador não mostra erros críticos

## 🔧 Solução Rápida

**1. Criar `.env.local` completo:**

```bash
# Copiar exemplo
cp .env.local.example .env.local

# Editar e preencher valores
nano .env.local  # ou use seu editor preferido
```

**2. Configurar banco de dados:**

```bash
# Aplicar migrations
npx prisma migrate dev

# Gerar Prisma Client
npx prisma generate

# Criar usuários de teste
npm run seed
```

**3. Reiniciar servidor:**

```bash
# Parar servidor (Ctrl+C)
# Reiniciar
npm run dev
```

**4. Tentar login novamente:**

- Email: `admin@tna.studio`
- Senha: `Admin@2025!`

## 🐛 Debug Avançado

**Verificar se NextAuth está funcionando:**

```bash
# Acessar endpoint de CSRF
curl http://localhost:3000/api/auth/csrf
```

**Verificar se banco está acessível:**

```bash
# Testar conexão
npx prisma db execute --stdin <<< "SELECT 1"
```

**Verificar logs detalhados:**

Adicione ao `.env.local`:

```env
DEBUG=*
# ou mais específico
DEBUG=next-auth:*
```

## 📞 Se ainda não funcionar

1. **Verificar logs do servidor** - Copie erros completos
2. **Verificar console do navegador** - Copie erros de rede
3. **Verificar se banco está acessível** - Teste conexão direta
4. **Verificar se usuário existe** - `npx prisma studio`

---

**Última atualização**: 2025-01-20

