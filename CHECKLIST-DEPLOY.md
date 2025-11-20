# Checklist de Deploy - TNA Studio

## 📋 Variáveis de Ambiente Necessárias

### 🔐 Vercel (Dashboard → Settings → Environment Variables)

#### 1. Banco de Dados (Neon PostgreSQL)

| Variável | Descrição | Exemplo | Obrigatório |
|----------|-----------|---------|-------------|
| `DATABASE_URL` | URL de conexão principal do PostgreSQL | `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/tna_studio?sslmode=require` | ✅ Sim |
| `DIRECT_URL` | URL direta para migrations (mesma do DATABASE_URL) | `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/tna_studio?sslmode=require` | ✅ Sim |

**Nota:** No Neon, use a connection string com `?sslmode=require` para conexões seguras.

#### 2. Autenticação (NextAuth)

| Variável | Descrição | Exemplo | Obrigatório |
|----------|-----------|---------|-------------|
| `NEXTAUTH_SECRET` | Chave secreta para assinar tokens JWT (32+ caracteres) | Gerar com: `openssl rand -base64 32` | ✅ Sim |
| `NEXTAUTH_URL` | URL completa da aplicação em produção | `https://tna-studio.vercel.app` | ✅ Sim |
| `AUTH_TRUST_HOST` | Permite NextAuth confiar no host (true em produção) | `true` | ✅ Sim |

**Como gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Importante:** 
- Use o mesmo `NEXTAUTH_SECRET` em todos os ambientes (produção, preview, etc.)
- `NEXTAUTH_URL` deve ser a URL exata do seu domínio (sem trailing slash)

#### 3. Storage (Cloudflare R2)

| Variável | Descrição | Exemplo | Obrigatório |
|----------|-----------|---------|-------------|
| `CLOUDFLARE_ACCOUNT_ID` | ID da conta Cloudflare | `abc123def456...` | ✅ Sim (produção) |
| `R2_ACCESS_KEY_ID` | Access Key ID do R2 | `abc123def456...` | ✅ Sim (produção) |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key do R2 | `xyz789uvw012...` | ✅ Sim (produção) |
| `R2_BUCKET_NAME` | Nome do bucket R2 | `tna-studio-media` | ✅ Sim (produção) |

**Como obter credenciais R2:**
1. Acesse Cloudflare Dashboard → R2
2. Crie um bucket (ex: `tna-studio-media`)
3. Vá em "Manage R2 API Tokens"
4. Crie um token com permissões de leitura/escrita
5. Copie `Access Key ID` e `Secret Access Key`
6. `Account ID` está na URL do dashboard

**Nota:** Em desenvolvimento, essas variáveis são opcionais (sistema usa modo mock).

#### 4. Ambiente

| Variável | Descrição | Exemplo | Obrigatório |
|----------|-----------|---------|-------------|
| `NODE_ENV` | Ambiente de execução | `production` | ✅ Sim (auto-set pela Vercel) |

**Nota:** A Vercel define `NODE_ENV=production` automaticamente.

---

## 🔧 Configuração no Cloudflare R2

### 1. Criar Bucket

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá em **R2** → **Create bucket**
3. Nome: `tna-studio-media` (ou o que preferir)
4. Localização: Escolha a mais próxima dos seus usuários

### 2. Criar API Token

1. Em R2, vá em **Manage R2 API Tokens**
2. Clique em **Create API Token**
3. Nome: `tna-studio-production`
4. Permissões: **Object Read & Write**
5. TTL: **No expiration** (ou defina expiração se preferir)
6. Copie `Access Key ID` e `Secret Access Key`

### 3. Configurar CORS (Opcional)

Se precisar acessar arquivos diretamente do browser:

1. No bucket, vá em **Settings** → **CORS Policy**
2. Adicione política permitindo seu domínio

**Nota:** Como usamos URLs assinadas, CORS geralmente não é necessário.

---

## 🔧 Configuração no Neon PostgreSQL

### 1. Criar Banco de Dados

1. Acesse [Neon Console](https://console.neon.tech)
2. Crie um novo projeto
3. Nome do banco: `tna_studio`
4. Copie a connection string

### 2. Rodar Migrations

```bash
# Localmente, com DATABASE_URL apontando para Neon
npx prisma migrate deploy
npx prisma generate
```

**Ou via Vercel:**
- Adicione `DATABASE_URL` e `DIRECT_URL` nas variáveis
- Rode migrations no build (adicionar script no `package.json`)

---

## 📝 Checklist Pré-Deploy

### Antes do Deploy

- [ ] Todas as variáveis de ambiente configuradas na Vercel
- [ ] `NEXTAUTH_SECRET` gerado e configurado
- [ ] `NEXTAUTH_URL` apontando para domínio de produção
- [ ] Credenciais R2 configuradas e testadas
- [ ] Banco de dados Neon criado e migrations rodadas
- [ ] Testado build local: `npm run build`
- [ ] Verificado que middleware não ultrapassa 1 MB
- [ ] Testado upload local com R2 real (se possível)

### Durante o Deploy

- [ ] Build completa sem erros
- [ ] Variáveis de ambiente carregadas corretamente
- [ ] Conexão com banco de dados funcionando
- [ ] Conexão com R2 funcionando

### Após o Deploy

- [ ] Login funciona corretamente
- [ ] Upload de fotos funciona
- [ ] URLs assinadas geradas corretamente
- [ ] Thumbnails carregam corretamente
- [ ] Sessão expira em 5 minutos
- [ ] Middleware protege rotas corretamente
- [ ] Logs de auditoria aparecem no console da Vercel

---

## 🚨 Troubleshooting

### Erro: "R2 não configurado em produção"
- **Causa:** Variáveis R2_* não configuradas
- **Solução:** Adicione todas as 4 variáveis R2 na Vercel

### Erro: "NEXTAUTH_SECRET não definido"
- **Causa:** Variável não configurada
- **Solução:** Gere com `openssl rand -base64 32` e adicione na Vercel

### Erro: "Database connection failed"
- **Causa:** `DATABASE_URL` incorreto ou banco não acessível
- **Solução:** Verifique connection string do Neon e permissões de IP

### Erro: "Middleware too large"
- **Causa:** Middleware > 1 MB
- **Solução:** Já simplificado, mas verifique se não há imports pesados

### Upload falha em produção
- **Causa:** R2 não configurado ou credenciais incorretas
- **Solução:** Verifique todas as variáveis R2_* e teste conexão

---

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

## ✅ Validação Final

Após deploy, teste:

1. ✅ Login com credenciais válidas
2. ✅ Criação de galeria
3. ✅ Upload de foto (máx 10 MB, tipos permitidos)
4. ✅ Visualização de thumbnail
5. ✅ Sessão expira após 5 minutos
6. ✅ Logout limpa cookies
7. ✅ Acesso negado sem autenticação
8. ✅ Rate limiting funciona (tente 11 uploads em 1 minuto)

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique logs na Vercel Dashboard
2. Verifique variáveis de ambiente
3. Teste conexões (banco, R2) separadamente
4. Consulte documentação:
   - [NextAuth.js](https://next-auth.js.org)
   - [Cloudflare R2](https://developers.cloudflare.com/r2)
   - [Neon PostgreSQL](https://neon.tech/docs)

