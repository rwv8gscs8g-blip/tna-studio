# Debug de Login - Problemas por Navegador

## 🚨 Problemas Reportados

- ✅ **Chrome (Client1):** Login funciona
- ❌ **Safari (Admin):** Não loga
- ❌ **Atlas (Model1):** Não loga

## 🔍 Possíveis Causas

### 1. Cookies `__Secure-` no Safari

Safari é mais restritivo com cookies que começam com `__Secure-`:
- ✅ Requer HTTPS (já temos)
- ✅ Requer flag `secure: true` (já temos)
- ⚠️ Pode ter problemas com `sameSite: "lax"` em alguns casos
- ⚠️ Pode bloquear cookies de terceiros mais agressivamente

### 2. Tratamento de Erros

**Problema anterior:**
- `redirect: true` não permite capturar erros
- Erros ficam silenciosos
- Usuário não sabe o que está errado

**Correção aplicada:**
- ✅ `redirect: false` para capturar erros
- ✅ Mensagens de erro claras
- ✅ Logs no console para debug

### 3. CSRF Token

Alguns navegadores podem ter problemas com CSRF token:
- Safari pode bloquear cookies de CSRF
- Atlas pode ter políticas de privacidade mais restritivas

## ✅ Correções Aplicadas

### 1. Tratamento de Erros Melhorado

**Arquivo:** `src/app/signin/page.tsx`

**Mudanças:**
- ✅ `redirect: false` para capturar erros
- ✅ Verifica `res?.error` e mostra mensagem
- ✅ Verifica `res?.ok` antes de redirecionar
- ✅ Logs detalhados no console
- ✅ Redirecionamento manual após sucesso

### 2. Configuração de Cookies

**Arquivo:** `src/auth.ts`

**Mudanças:**
- ✅ Configuração explícita de `csrfToken` cookie
- ✅ Mesmas configurações de segurança
- ✅ Compatível com Safari

## 🧪 Como Testar

### Safari (Admin)

1. **Limpar tudo:**
   ```bash
   # No Safari:
   - Safari → Preferências → Privacidade
   - Gerenciar Dados de Sites
   - Remover tna-studio.vercel.app
   - Limpar histórico e cache
   ```

2. **Abrir console:**
   - Desenvolvedor → Mostrar Web Inspector
   - Console tab

3. **Tentar login:**
   - Acessar https://tna-studio.vercel.app/signin
   - Login: admin@tna.studio / Admin@2025!
   - Verificar console para logs `[SignIn]`
   - Verificar erros no console

4. **Verificar cookies:**
   - Storage → Cookies → tna-studio.vercel.app
   - Verificar se `__Secure-next-auth.session-token` existe
   - Verificar flags: Secure, HttpOnly, SameSite

### Atlas (Model1)

1. **Limpar tudo:**
   - Limpar cookies e cache
   - Modo anônimo se possível

2. **Abrir console:**
   - DevTools (F12)
   - Console tab

3. **Tentar login:**
   - Acessar https://tna-studio.vercel.app/signin
   - Login: model1@tna.studio / Model1@2025!
   - Verificar console para logs `[SignIn]`
   - Verificar erros

4. **Verificar cookies:**
   - Application → Cookies
   - Verificar se cookie de sessão existe

## 🔍 Logs para Verificar

### Console do Navegador

**Logs esperados:**
```
[SignIn] Login bem-sucedido, redirecionando...
```

**Erros possíveis:**
```
[SignIn] Erro no login: CredentialsSignin
[SignIn] Erro ao fazer login: [mensagem]
[SignIn] Resposta inesperada do signIn: [objeto]
```

### Logs na Vercel

**Acessar:** Vercel Dashboard → tna-studio → Logs

**Logs esperados:**
```
[Auth] Novo token criado para userId=...
```

**Erros possíveis:**
```
[Auth] Token REJEITADO - expirado
⚠️ Rate limit exceeded for [IP]
```

## 🚨 Se Ainda Não Funcionar

### Opção 1: Verificar NEXTAUTH_URL

**Na Vercel:**
- Settings → Environment Variables
- Verificar `NEXTAUTH_URL` = `https://tna-studio.vercel.app`
- **IMPORTANTE:** Sem trailing slash, com https://

### Opção 2: Testar sem `__Secure-` prefix

Se Safari continuar bloqueando, podemos testar sem o prefixo:

```typescript
// Temporariamente, para debug
name: "next-auth.session-token", // Sem __Secure- prefix
```

**⚠️ ATENÇÃO:** Isso reduz segurança. Apenas para debug.

### Opção 3: Verificar Políticas de Privacidade

**Safari:**
- Preferências → Privacidade
- Verificar se "Impedir rastreamento entre sites" está desativado
- Verificar se "Bloquear todos os cookies" está desativado

**Atlas:**
- Verificar configurações de privacidade
- Verificar se bloqueia cookies de terceiros

## 📋 Checklist de Debug

- [ ] Cookies limpos no navegador
- [ ] Console aberto para ver logs
- [ ] Tentar login e verificar mensagens de erro
- [ ] Verificar cookies após tentativa de login
- [ ] Verificar logs na Vercel
- [ ] Verificar NEXTAUTH_URL na Vercel
- [ ] Testar em modo anônimo/privado

## ✅ Próximos Passos

1. ✅ Código corrigido (tratamento de erros)
2. ⏳ **Fazer commit e push**
3. ⏳ **Fazer deploy**
4. ⏳ **Testar nos navegadores com console aberto**
5. ⏳ **Verificar logs na Vercel**
6. ⏳ **Reportar erros específicos do console**

---

**Data:** 2025-11-20
**Status:** Correções aplicadas, aguardando deploy e testes

