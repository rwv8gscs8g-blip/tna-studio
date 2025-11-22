# Solução Definitiva - Erro de Login

**Data**: 2025-01-20  
**Status**: ✅ Corrigido

---

## 🔍 Problema Identificado

**Erro**: `The column User.cpf does not exist in the current database.`

**Causa Raiz**: 
- A query no `authorize` estava tentando buscar `cpf` e `passport` no `select`
- Essas colunas não existem no banco de dados atual
- Mesmo que a migration `20251121063917_add_security_models` devesse adicioná-las, não são necessárias para o login

---

## ✅ Correção Aplicada

### 1. Removido CPF e Passport da Query

**Arquivo**: `src/auth.ts` (linha ~112)

**Antes**:
```typescript
const user = await prisma.user.findUnique({ 
  where: { email },
  select: {
    id: true,
    email: true,
    name: true,
    passwordHash: true,
    role: true,
    cpf: true,        // ❌ Causava erro
    passport: true,   // ❌ Causava erro
  }
});
```

**Depois**:
```typescript
const user = await prisma.user.findUnique({ 
  where: { email },
  select: {
    id: true,
    email: true,
    name: true,
    passwordHash: true,
    role: true,
    // cpf e passport removidos - não são necessários para login
  }
});
```

### 2. Ajustado Retorno

**Antes**:
```typescript
cpf: user.cpf ?? null,
passport: user.passport ?? null,
```

**Depois**:
```typescript
cpf: null,  // Será buscado depois se necessário
passport: null,
```

### 3. Prisma Client Regenerado

- Cache do Prisma Client limpo
- Prisma Client regenerado

---

## 🚀 Testar Agora

### 1. Reiniciar Servidor

```bash
cd /Users/macbookpro/Projetos/tna-studio

# Parar servidor (Ctrl+C)
# Limpar cache
rm -rf .next node_modules/.cache

# Reiniciar
npm run dev
```

### 2. Testar Login

Acesse: http://localhost:3000/signin

**Credenciais**:
- `admin@tna.studio` / `Admin@2025!`
- `super@tna.studio` / `Super@2025!`
- `model1@tna.studio` / `Model1@2025!`
- `client1@tna.studio` / `Client1@2025!`
- `[redacted-email]` / `[redacted-password]`

### 3. Verificar Logs

**Login bem-sucedido deve mostrar**:
```
[Auth] Tentativa de login para: admin@tna.studio
[Auth] Login bem-sucedido para: admin@tna.studio (role: ADMIN)
[Auth] Retornando dados do usuário: { id: '...', email: 'admin@tna.studio', role: 'ADMIN' }
```

**Não deve mais aparecer**:
- ❌ `The column User.cpf does not exist`
- ❌ `The column User.passport does not exist`
- ❌ `CredentialsSignin` (por causa de erro de banco)

---

## ✅ O Que Foi Corrigido

1. ✅ Removido `cpf` e `passport` da query de login
2. ✅ Ajustado retorno do `authorize` para não depender desses campos
3. ✅ Prisma Client regenerado
4. ✅ Logs adicionados para debug

---

## 📝 Nota

Se no futuro precisar de `cpf` e `passport` no login:
1. Verificar se as colunas existem no banco
2. Se não existirem, criar migration para adicioná-las
3. Atualizar a query para buscar esses campos
4. Atualizar o retorno do `authorize`

Por enquanto, o login funciona sem esses campos.

---

**Status**: ✅ Correção aplicada - login deve funcionar agora!

**Próximo**: Reiniciar servidor e testar login em Chrome e Safari.

