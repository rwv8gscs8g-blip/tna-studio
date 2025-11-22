# Correções Críticas de Login - 2025-11-19

## Problemas Identificados

### 1. Erro: `headers()` não estava sendo awaited
**Erro**: `Route "/api/auth/[...nextauth]" used headers().get('x-forwarded-for'). headers() should be awaited`

**Causa**: Next.js 15 requer que `headers()` seja `await`ed antes de usar seu valor.

**Solução**: Alterado `const hdrs = headers()` para `const hdrs = await headers()`.

### 2. Build Version sendo gerado múltiplas vezes
**Problema**: O sistema estava gerando um novo `BUILD_TIMESTAMP` a cada requisição, causando:
- Token criado com `build-1763592019178`
- Imediatamente rejeitado porque build atual mudou para `build-1763592018643`
- Loop infinito de rejeição

**Causa**: Módulo `build-version.ts` sendo recarregado a cada requisição, gerando novo timestamp.

**Solução**: Implementado **singleton global** usando `global.__BUILD_TIMESTAMP` que persiste entre requisições no mesmo processo Node.js.

```typescript
declare global {
  var __BUILD_TIMESTAMP: number | undefined;
  var __BUILD_VERSION: string | undefined;
}

function getBuildTimestamp(): number {
  if (typeof global.__BUILD_TIMESTAMP === "undefined") {
    global.__BUILD_TIMESTAMP = Date.now();
    // ... inicializa apenas uma vez
  }
  return global.__BUILD_TIMESTAMP;
}
```

### 3. Hydration Error no SignIn
**Erro**: `Hydration failed because the server rendered HTML didn't match the client`

**Causa**: `useSearchParams()` usado diretamente em componente client sem `Suspense` boundary.

**Solução**: Envolvido componente em `Suspense`:

```typescript
export default function SignInPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <SignInForm />
    </Suspense>
  );
}
```

### 4. Lógica de Validação Muito Complexa
**Problema**: Validação tripla (build antigo + buildVersion + expiração) estava causando rejeições desnecessárias.

**Solução**: Simplificada para validação dupla:
1. Verifica expiração primeiro (mais crítico)
2. Verifica se token é de build antigo usando apenas `iat` vs `BUILD_TIMESTAMP`
3. Removido `buildVersion` do token (não necessário)

## Arquivos Modificados

1. **src/auth.ts**:
   - ✅ `await headers()` adicionado
   - ✅ Validação simplificada (removido buildVersion)
   - ✅ Logs melhorados

2. **src/lib/build-version.ts**:
   - ✅ Singleton global implementado
   - ✅ Timestamp gerado apenas uma vez por processo

3. **src/app/signin/page.tsx**:
   - ✅ Suspense boundary adicionado
   - ✅ Componente separado em `SignInForm` + wrapper

## Como Funciona Agora

1. **Inicialização do Servidor**:
   - `BUILD_TIMESTAMP` é gerado UMA VEZ quando o processo Node.js inicia
   - Persiste em `global.__BUILD_TIMESTAMP` para todas as requisições

2. **Criação de Token**:
   - Token recebe `iat` (timestamp de criação em segundos)
   - Token recebe `exp` (iat + 300 segundos = 5 minutos)

3. **Validação de Token**:
   - Verifica se `exp < now` → rejeita se expirado
   - Verifica se `iat * 1000 < BUILD_TIMESTAMP` → rejeita se de build antigo
   - Se ambas passarem, token é válido

4. **Reinício do Servidor**:
   - Novo processo Node.js inicia
   - Novo `BUILD_TIMESTAMP` é gerado
   - Todos os tokens antigos (com `iat` anterior) são automaticamente rejeitados

## Testes de Validação

Após essas correções, teste:

1. ✅ Login funciona corretamente
2. ✅ Token é criado e aceito imediatamente
3. ✅ Reiniciar servidor invalida tokens antigos
4. ✅ Sessão expira em 5 minutos
5. ✅ Sem hydration errors
6. ✅ Sem erros de `headers()` no console

## Logs Esperados (Sucesso)

```
[BuildVersion] Build iniciado em [timestamp] (versão: build-[timestamp])
[Auth] Novo token criado para userId=... (expira em [timestamp])
POST /api/auth/callback/credentials? 200 in [ms]
GET / 200 in [ms]  ← Usuário acessa página protegida com sucesso
```

## Logs de Erro (Se ainda houver problema)

Se você ainda vê:
```
[Auth] Token REJEITADO - build antigo
```

Isso significa que há um token antigo no cookie. Solução:
1. Limpe cookies manualmente (DevTools > Application > Cookies)
2. Ou acesse `/signin?clearCookies=1` que limpa automaticamente

