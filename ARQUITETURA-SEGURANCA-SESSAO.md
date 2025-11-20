# Arquitetura de Segurança de Sessão

## Princípio Fundamental

**Toda lógica de segurança de sessão está 100% no servidor.** O cliente é apenas visual e nunca toma decisões de segurança.

## Componentes

### 1. Servidor (auth.ts)

#### Callback `jwt`:
- **Criação de token**: Define `token.iat` (timestamp de criação) e `token.exp` (iat + 300 segundos = 5 minutos)
- **Validação de token existente**:
  1. Verifica se `token.exp < now` (usando `Date.now()` do servidor)
  2. Verifica se token é de build antigo (usando `BUILD_TIMESTAMP`)
  3. Retorna `null` se qualquer validação falhar

#### Callback `session`:
- Recebe token validado (ou `null` se inválido)
- Se token é `null`, retorna sessão com `user: null`
- Se token é válido, define `session.expires` baseado em `token.exp`
- `session.expires` é uma ISO string calculada no servidor

### 2. Cliente (SessionTimer.tsx)

#### Responsabilidades:
- **Apenas visual**: Exibe tempo restante baseado em `session.expires`
- Calcula diferença entre `session.expires` (do servidor) e `Date.now()` (do cliente)
- Atualiza display a cada segundo

#### NÃO faz:
- ❌ Não valida expiração
- ❌ Não redireciona usuário
- ❌ Não toma decisões de segurança
- ❌ Não confia no relógio do cliente para segurança

### 3. Middleware (middleware.ts)

#### Responsabilidades:
- Verifica se há sessão válida usando `auth()` (que chama callbacks jwt/session)
- Se sessão é inválida (token expirado ou de build antigo):
  - Limpa todos os cookies
  - Redireciona para `/signin?clearCookies=1`

## Fluxo de Validação

```
1. Cliente faz requisição
   ↓
2. Middleware chama auth()
   ↓
3. NextAuth chama callback jwt
   ├─ Se token.exp < Date.now() (servidor) → retorna null
   ├─ Se token.iat < BUILD_TIMESTAMP → retorna null
   └─ Caso contrário → retorna token válido
   ↓
4. NextAuth chama callback session
   ├─ Se token é null → retorna { user: null }
   └─ Se token é válido → retorna { user: {...}, expires: "ISO string" }
   ↓
5. Middleware verifica session.user
   ├─ Se null → limpa cookies e redireciona
   └─ Se válido → permite acesso
   ↓
6. Cliente recebe session.expires
   ↓
7. SessionTimer calcula tempo restante (apenas visual)
```

## Proteções Implementadas

### 1. Validação no Servidor
- ✅ Servidor usa seu próprio `Date.now()` para validar `token.exp`
- ✅ Cliente não pode alterar relógio do servidor
- ✅ Mesmo que cliente altere seu relógio, servidor rejeita tokens expirados

### 2. Invalidação por Build
- ✅ Tokens criados antes de restart são automaticamente inválidos
- ✅ `BUILD_TIMESTAMP` é gerado uma vez por processo (singleton global)

### 3. Expiração de 5 Minutos
- ✅ Tokens expiram em exatamente 300 segundos (5 minutos)
- ✅ Validação acontece em cada requisição no callback jwt

### 4. Limpeza Automática
- ✅ Middleware limpa cookies quando detecta sessão inválida
- ✅ Cliente também limpa cookies quando recebe `clearCookies=1`

## Por Que Esta Arquitetura?

### Segurança
- Cliente nunca confiável para decisões de segurança
- Servidor tem controle total sobre validação
- Relógio do cliente pode ser alterado, mas servidor sempre usa seu próprio tempo

### Simplicidade
- Lógica centralizada no servidor (auth.ts)
- Cliente apenas exibe informações
- Fácil de debugar e manter

### Confiabilidade
- Mesmo se JavaScript do cliente falhar, servidor continua protegendo
- Middleware garante que rotas protegidas sempre verificam sessão
- Tokens expirados são rejeitados imediatamente

## Testes de Validação

### Teste 1: Expiração no Servidor
1. Faça login
2. Aguarde 5 minutos
3. Tente acessar página protegida
4. **Resultado esperado**: Redirecionado para `/signin` (servidor rejeitou token expirado)

### Teste 2: Alteração de Relógio do Cliente
1. Faça login
2. Altere relógio do sistema para +10 minutos
3. Tente acessar página protegida
4. **Resultado esperado**: Ainda funciona (servidor usa seu próprio tempo)
5. Aguarde 5 minutos reais
6. Tente acessar novamente
7. **Resultado esperado**: Redirecionado para `/signin` (servidor rejeitou após 5 minutos reais)

### Teste 3: Reinício do Servidor
1. Faça login
2. Reinicie servidor
3. Tente acessar página protegida
4. **Resultado esperado**: Redirecionado para `/signin` (token de build antigo rejeitado)

## Logs Importantes

```
[Auth] Novo token criado para userId=... (expira em [timestamp])
[Auth] Token REJEITADO - expirado (exp: [timestamp], now: [timestamp])
[Auth] Token REJEITADO - build antigo
[Middleware] Sessão inválida detectada - cookies limpos e redirecionando para login
```

## Conclusão

A arquitetura garante que:
- ✅ Segurança está 100% no servidor
- ✅ Cliente é apenas visual
- ✅ Relógio do cliente não afeta segurança
- ✅ Tokens expirados são rejeitados imediatamente
- ✅ Build antigos são invalidados automaticamente

