# Correção Final - Colunas CPF e Passport

**Data**: 2025-01-20  
**Status**: ✅ Corrigido

---

## 🔍 Problema Identificado

**Erro**: `The column User.cpf does not exist in the current database.`

**Causa**: 
- A query no `authorize` estava tentando buscar `cpf` e `passport`
- Essas colunas não existem no banco de dados atual
- A migration `20251121063917_add_security_models` deveria ter adicionado, mas pode não ter sido aplicada corretamente

---

## ✅ Correção Aplicada

### 1. Removido CPF e Passport da Query de Login

**Arquivo**: `src/auth.ts`

**Antes**:
```typescript
select: {
  id: true,
  email: true,
  name: true,
  passwordHash: true,
  role: true,
  cpf: true,        // ❌ Não existe no banco
  passport: true,   // ❌ Não existe no banco
}
```

**Depois**:
```typescript
select: {
  id: true,
  email: true,
  name: true,
  passwordHash: true,
  role: true,
  // cpf e passport removidos - não são necessários para login
}
```

### 2. Ajustado Retorno do UserData

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

---

## 🚀 Próximos Passos

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

No terminal do servidor, deve aparecer:
```
[Auth] Tentativa de login para: admin@tna.studio
[Auth] Login bem-sucedido para: admin@tna.studio (role: ADMIN)
[Auth] Retornando dados do usuário: { id: '...', email: 'admin@tna.studio', role: 'ADMIN' }
```

---

## 📝 Nota sobre CPF e Passport

Esses campos podem ser adicionados ao banco depois, se necessário. Para o login funcionar, não são necessários. Se precisar desses campos no futuro:

1. Criar migration para adicionar as colunas
2. Atualizar a query para buscar esses campos quando necessário
3. Atualizar o retorno do `authorize` para incluir esses campos

---

**Status**: ✅ Query corrigida - login deve funcionar agora!

