# Operação e Deploy TNA Studio

## 🚀 Rodar Localmente

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie `.env.local` na raiz:

```env
# Banco de dados (OBRIGATÓRIO)
DATABASE_URL="postgresql://user:pass@host:port/database?sslmode=require"
DIRECT_URL="postgresql://user:pass@host:port/database?sslmode=require"

# Autenticação (OBRIGATÓRIO)
NEXTAUTH_SECRET="gerar_com_openssl_rand_base64_32"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true

# Storage R2 (opcional em dev - usa modo mock)
CLOUDFLARE_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="tna-studio-media"
```

**Gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Aplicar Migrations

```bash
# Aplicar migrations no Neon (banco único)
npx prisma migrate deploy

# Gerar Prisma Client
npx prisma generate

# Criar dados básicos do sistema (produtos, etc.)
npm run seed
```

### 4. Criar Primeiro Usuário Arquiteto (Base Zerada)

**⚠️ IMPORTANTE:** O seed não cria usuários automaticamente. Você deve criar o primeiro usuário ARQUITETO manualmente.

**Opção A - Base Zerada (Recomendado para início):**

```bash
# 1. Zerar a base (apenas em desenvolvimento local)
npx prisma migrate reset

# 2. Rodar o seed novamente (cria apenas produtos)
npm run seed

# 3. Configurar variáveis de ambiente para criar o primeiro ARQUITETO
export INIT_ARCHITECT_NAME="Nome do Arquiteto"
export INIT_ARCHITECT_EMAIL="arquiteto@example.com"
export INIT_ARCHITECT_PASSWORD="SenhaSegura123!"
export INIT_ARCHITECT_PHONE="+5500000000000"  # Opcional

# 4. Criar o primeiro usuário ARQUITETO
npm run create:initial-architect
```

**Opção B - Sem Zerar a Base:**

Se você já tem uma base com dados e apenas quer criar um novo ARQUITETO:

```bash
# Configurar variáveis de ambiente
export INIT_ARCHITECT_NAME="Nome do Arquiteto"
export INIT_ARCHITECT_EMAIL="arquiteto@example.com"
export INIT_ARCHITECT_PASSWORD="SenhaSegura123!"
export INIT_ARCHITECT_PHONE="+5500000000000"  # Opcional

# Criar o usuário ARQUITETO
npm run create:initial-architect
```

**Notas:**
- O script verifica se já existe um ARQUITETO antes de criar
- O script valida formato de email e senha mínima (8 caracteres)
- Nunca use dados pessoais reais diretamente no código
- Use sempre variáveis de ambiente para credenciais

### 5. Iniciar Servidor

```bash
npm run dev
```

Acesse `http://localhost:3000`

## 📦 Aplicar Migrations no Neon com Segurança

### ⚠️ AVISO IMPORTANTE

**Este projeto usa banco único para dev e produção.**

**NUNCA execute:**
- `npx prisma migrate reset` (apaga todos os dados)
- `npx prisma db push` (pode causar perda de dados)
- Qualquer comando que modifique o schema sem migration

### Comandos Seguros

**Desenvolvimento:**
```bash
# Criar nova migration
npx prisma migrate dev --name nome_da_migration

# Aplicar migrations pendentes
npx prisma migrate deploy

# Gerar Prisma Client após migrations
npx prisma generate
```

**Produção:**
```bash
# Aplicar migrations (NUNCA usar migrate dev em produção)
npx prisma migrate deploy

# Gerar Prisma Client
npx prisma generate
```

### Neon Branching (Recomendado para Migrations Grandes)

**Quando usar:**
- Migrations que alteram muitas tabelas
- Migrations que podem causar downtime
- Testes de migrations destrutivas

**Como usar:**
1. Criar branch no Neon Dashboard
2. Atualizar `DATABASE_URL` para apontar para o branch
3. Testar migration no branch
4. Se tudo OK, promover branch para produção
5. Se houver problemas, descartar branch

**Documentação Neon**: https://neon.tech/docs/branching

## 🚢 Build e Deploy na Vercel

### 1. Configurar Variáveis de Ambiente

Na Vercel Dashboard → Settings → Environment Variables:

**Obrigatórias:**
- `DATABASE_URL` - URL de conexão do Neon
- `DIRECT_URL` - Mesma URL do Neon (para migrations)
- `NEXTAUTH_SECRET` - Chave secreta (gerar com `openssl rand -base64 32`)
- `NEXTAUTH_URL` - URL completa da aplicação (ex: `https://tna-studio.vercel.app`)
- `AUTH_TRUST_HOST` - `true`
- `CLOUDFLARE_ACCOUNT_ID` - ID da conta Cloudflare
- `R2_ACCESS_KEY_ID` - Access Key do R2
- `R2_SECRET_ACCESS_KEY` - Secret Key do R2
- `R2_BUCKET_NAME` - Nome do bucket R2

### 2. Testar Build Local

```bash
npm run build
```

Verificar se não há erros de TypeScript ou build.

### 3. Deploy

```bash
# Deploy na Vercel
vercel --prod
```

**Ou via Git:**
- Push para branch `main` → deploy automático

### 4. Aplicar Migrations em Produção

**Após deploy:**
```bash
# Conectar ao ambiente de produção
vercel env pull .env.production

# Aplicar migrations
npx prisma migrate deploy

# Gerar Prisma Client
npx prisma generate
```

**Ou via Vercel CLI:**
```bash
vercel exec -- npm run prisma:migrate:deploy
```

## ✅ Checklist Pré-Deploy

### Antes de Cada Deploy

- [ ] Testado build local: `npm run build`
- [ ] Testado em localhost: `npm run dev`
- [ ] Migrations aplicadas e testadas localmente
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Verificado que não há comandos destrutivos no código
- [ ] Verificado que middleware não ultrapassa 1 MB
- [ ] Testado login com cada role
- [ ] Testado criação de ensaio (ARQUITETO)
- [ ] Testado visualização de ensaio (MODELO/CLIENTE)
- [ ] Testado solicitação de alteração de dados
- [ ] Testado aprovação de solicitação (ARQUITETO)

### Durante o Deploy

- [ ] Build completa sem erros
- [ ] Variáveis de ambiente carregadas corretamente
- [ ] Conexão com banco de dados funcionando
- [ ] Conexão com R2 funcionando

### Após o Deploy

- [ ] Login funciona corretamente
- [ ] Redirecionamento por role funciona
- [ ] Upload de arquivos funciona
- [ ] URLs assinadas geradas corretamente
- [ ] Sessão expira corretamente
- [ ] Middleware protege rotas corretamente
- [ ] Avisos aparecem corretamente

## 🚨 Troubleshooting

### Erro: "Database connection failed"
- **Causa**: `DATABASE_URL` incorreto ou banco não acessível
- **Solução**: Verificar connection string do Neon e permissões de IP

### Erro: "NEXTAUTH_SECRET não definido"
- **Causa**: Variável não configurada
- **Solução**: Gerar com `openssl rand -base64 32` e adicionar na Vercel

### Erro: "R2 não configurado"
- **Causa**: Variáveis R2_* não configuradas
- **Solução**: Adicionar todas as 4 variáveis R2 na Vercel

### Erro: "Middleware too large"
- **Causa**: Middleware > 1 MB
- **Solução**: Verificar se não há imports pesados no middleware

### Upload falha em produção
- **Causa**: R2 não configurado ou credenciais incorretas
- **Solução**: Verificar todas as variáveis R2_* e testar conexão

## 📊 Monitoramento

### Logs Importantes

Monitore estes logs na Vercel:
- `[Upload] Sucesso:` - Uploads bem-sucedidos
- `[Upload] Erro:` - Erros de upload
- `[R2] URL assinada gerada` - URLs assinadas criadas
- `[Auth] Token REJEITADO` - Tentativas de acesso inválidas
- `[Middleware] Sessão inválida` - Redirecionamentos de segurança

### Métricas a Observar

- Taxa de sucesso de uploads
- Tempo de resposta de URLs assinadas
- Taxa de rejeição de tokens (possível ataque)
- Uso de storage R2

---

**Versão**: 1.0.0
**Última atualização**: 2025-01-25

