# Correções para Deploy na Vercel

## ❌ Problema Identificado

### 1. Conflito de Dependências

**Erro:**
```
npm error ERESOLVE could not resolve
npm error While resolving: @cloudflare/next-on-pages@1.13.16
npm error Found: next@15.5.6
npm error Could not resolve dependency:
npm error peer next@">=14.3.0 && <=15.5.2" from @cloudflare/next-on-pages@1.13.16
```

**Causa:**
- `@cloudflare/next-on-pages` é usado apenas para deploy no Cloudflare Pages
- Estamos fazendo deploy na **Vercel**, não Cloudflare Pages
- A dependência requer `next@<=15.5.2`, mas temos `next@15.5.6`

**Solução:**
- ✅ Removido `@cloudflare/next-on-pages` das devDependencies
- ✅ Removido script `cf:pages` do package.json

### 2. Variáveis de Ambiente Extras na Vercel

**Variáveis configuradas que NÃO são usadas no código:**

| Variável | Status | Ação |
|----------|--------|------|
| `MEDIA_GATEWAY_URL` | ❌ Não usado | **REMOVER** da Vercel |
| `R2_PUBLIC_URL` | ❌ Não usado | **REMOVER** da Vercel |
| `SESSION_MAX_AGE` | ❌ Não usado (hardcoded como 300) | **REMOVER** da Vercel |
| `ENABLE_SECURE_URLS` | ❌ Não usado | **REMOVER** da Vercel |

**Variáveis OBRIGATÓRIAS (já configuradas corretamente):**
- ✅ `DATABASE_URL`
- ✅ `DIRECT_URL`
- ✅ `NEXTAUTH_SECRET`
- ✅ `NEXTAUTH_URL`
- ✅ `AUTH_TRUST_HOST`
- ✅ `CLOUDFLARE_ACCOUNT_ID`
- ✅ `R2_ACCESS_KEY_ID`
- ✅ `R2_SECRET_ACCESS_KEY`
- ✅ `R2_BUCKET_NAME`
- ✅ `NODE_ENV` (auto-set pela Vercel)

## ✅ Correções Aplicadas

### 1. package.json
- ✅ Removido `@cloudflare/next-on-pages` das devDependencies
- ✅ Removido script `cf:pages`

### 2. Próximos Passos (Manual)

**Na Vercel Dashboard:**

1. **Remover variáveis não usadas:**
   - Vá em Settings → Environment Variables
   - Remova: `MEDIA_GATEWAY_URL`
   - Remova: `R2_PUBLIC_URL`
   - Remova: `SESSION_MAX_AGE`
   - Remova: `ENABLE_SECURE_URLS`

2. **Verificar variáveis obrigatórias:**
   - Confirme que todas as variáveis obrigatórias estão configuradas
   - Verifique se `NEXTAUTH_URL` está correto: `https://tna-studio.vercel.app`
   - Verifique se `R2_BUCKET_NAME` está correto: `tna-media-segura`

3. **Fazer novo deploy:**
   - Após remover as variáveis, faça um novo deploy
   - O build deve completar sem erros

## 🔍 Verificações Adicionais

### Verificar se há outras dependências conflitantes

Execute localmente:
```bash
npm install
```

Se houver erros, execute:
```bash
npm install --legacy-peer-deps
```

**Nota:** A Vercel usa `npm install` por padrão. Se precisar de `--legacy-peer-deps`, configure na Vercel:
- Settings → General → Install Command
- Altere para: `npm install --legacy-peer-deps`

### Verificar build local

```bash
npm run build
```

Se o build local funcionar, o deploy na Vercel também deve funcionar.

## 📝 Checklist Final

Antes do próximo deploy:

- [x] Removido `@cloudflare/next-on-pages` do package.json
- [x] Removido script `cf:pages`
- [ ] **MANUAL**: Remover variáveis não usadas na Vercel
- [ ] **MANUAL**: Verificar todas as variáveis obrigatórias
- [ ] Testar build local: `npm run build`
- [ ] Fazer novo deploy na Vercel

## 🚨 Se o Erro Persistir

Se ainda houver erro de dependências após remover `@cloudflare/next-on-pages`:

1. **Opção 1**: Usar `--legacy-peer-deps`
   - Configure na Vercel: Settings → General → Install Command
   - Valor: `npm install --legacy-peer-deps`

2. **Opção 2**: Atualizar Next.js para versão compatível
   - Se necessário, podemos ajustar a versão do Next.js
   - Mas `15.5.6` deve funcionar normalmente

3. **Opção 3**: Verificar package-lock.json
   - Commit o `package-lock.json` atualizado
   - Isso garante que a Vercel use as mesmas versões

## ✅ Status

- ✅ Código corrigido
- ⏳ Aguardando remoção manual de variáveis na Vercel
- ⏳ Aguardando novo deploy

