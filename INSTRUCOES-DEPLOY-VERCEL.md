# Instruções para Deploy na Vercel

## ✅ Correções Aplicadas no Código

### 1. Conflito de Dependências - RESOLVIDO

**Problema:**
- `@cloudflare/next-on-pages@1.13.16` requer `next@<=15.5.2`
- Projeto usa `next@15.5.6`
- Conflito de peer dependencies

**Solução:**
- ✅ Removido `@cloudflare/next-on-pages` (não necessário para Vercel)
- ✅ Removido script `cf:pages` do package.json

**Arquivo modificado:** `package.json`

## 🔧 Ações Manuais Necessárias na Vercel

### Passo 1: Remover Variáveis de Ambiente Não Usadas

Vá em **Settings → Environment Variables** e **REMOVA** estas variáveis:

1. ❌ `MEDIA_GATEWAY_URL` - Não usado no código
2. ❌ `R2_PUBLIC_URL` - Não usado no código  
3. ❌ `SESSION_MAX_AGE` - Não usado (hardcoded como 300)
4. ❌ `ENABLE_SECURE_URLS` - Não usado no código

### Passo 2: Verificar Variáveis Obrigatórias

Confirme que estas variáveis estão configuradas:

#### ✅ Banco de Dados
- `DATABASE_URL` - ✅ Já configurado
- `DIRECT_URL` - ✅ Já configurado

#### ✅ Autenticação
- `NEXTAUTH_SECRET` - ✅ Já configurado
- `NEXTAUTH_URL` - ✅ Já configurado (`https://tna-studio.vercel.app`)
- `AUTH_TRUST_HOST` - ✅ Já configurado (`true`)

#### ✅ Storage R2
- `CLOUDFLARE_ACCOUNT_ID` - ✅ Já configurado
- `R2_ACCESS_KEY_ID` - ✅ Já configurado
- `R2_SECRET_ACCESS_KEY` - ✅ Já configurado
- `R2_BUCKET_NAME` - ✅ Já configurado (`tna-media-segura`)

#### ✅ Ambiente
- `NODE_ENV` - ✅ Auto-set pela Vercel (`production`)

### Passo 3: Verificar Configurações de Build

Vá em **Settings → General** e verifique:

- **Install Command**: Deve estar vazio ou `npm install`
  - Se houver erro de dependências, altere para: `npm install --legacy-peer-deps`
- **Build Command**: Deve estar vazio (usa `npm run build` do package.json)
- **Output Directory**: Deve estar vazio (Next.js detecta automaticamente)

### Passo 4: Fazer Novo Deploy

1. Após remover as variáveis não usadas
2. Faça commit das alterações no `package.json` (se ainda não fez)
3. Vá em **Deployments** → **Redeploy** ou faça push para o repositório

## 📋 Checklist Completo

### Antes do Deploy
- [x] Código corrigido (package.json atualizado)
- [ ] **MANUAL**: Remover variáveis não usadas na Vercel
- [ ] **MANUAL**: Verificar todas as variáveis obrigatórias
- [ ] Commit e push das alterações

### Durante o Deploy
- [ ] Build completa sem erros
- [ ] Dependências instaladas corretamente
- [ ] Variáveis de ambiente carregadas

### Após o Deploy
- [ ] Aplicação acessível em `https://tna-studio.vercel.app`
- [ ] Login funciona
- [ ] Upload funciona
- [ ] URLs assinadas geradas corretamente

## 🚨 Se Ainda Houver Erros

### Erro: "npm install failed"

**Solução 1:** Usar legacy peer deps
- Settings → General → Install Command
- Altere para: `npm install --legacy-peer-deps`

**Solução 2:** Verificar package-lock.json
- Certifique-se de que `package-lock.json` está commitado
- A Vercel usa o lock file para garantir versões consistentes

### Erro: "Build failed"

**Verificar:**
1. Logs completos do build na Vercel
2. Se há erros de TypeScript
3. Se há erros de ESLint (pode ignorar se configurado)
4. Se há erros de Prisma (migrations não rodadas)

### Erro: "Environment variable not found"

**Verificar:**
1. Se todas as variáveis obrigatórias estão configuradas
2. Se as variáveis estão no ambiente correto (Production, Preview, Development)
3. Se os valores estão corretos (sem espaços extras)

## 📊 Variáveis Finais (Resumo)

### Manter na Vercel (9 variáveis)
```
DATABASE_URL
DIRECT_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
AUTH_TRUST_HOST
CLOUDFLARE_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
```

### Remover da Vercel (4 variáveis)
```
MEDIA_GATEWAY_URL
R2_PUBLIC_URL
SESSION_MAX_AGE
ENABLE_SECURE_URLS
```

## ✅ Status Atual

- ✅ **Código corrigido** - Conflito de dependências resolvido
- ⏳ **Aguardando ações manuais** - Remover variáveis não usadas
- ⏳ **Aguardando novo deploy** - Após correções manuais

---

**Próximo passo:** Remover as 4 variáveis não usadas na Vercel e fazer novo deploy.

