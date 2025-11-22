# Correção - Coluna `acceptedAt` não existe

**Data**: 2025-01-20  
**Status**: ✅ Corrigido

---

## 🔍 Problema Identificado

**Erro**: `The column User.acceptedAt does not exist in the current database.`

**Causa**: 
- O schema Prisma define o campo `acceptedAt` no model `User`
- A migration inicial (`20251119084202_init`) não criou esse campo
- O Prisma Client estava tentando buscar campos que não existiam no banco

---

## ✅ Correção Aplicada

### 1. Migration Criada

**Arquivo**: `prisma/migrations/20251121165854_add_user_missing_fields/migration.sql`

Esta migration adiciona todos os campos que estavam faltando na tabela `User`:
- `acceptedAt`
- `address`
- `adminMessage`
- `birthDate`
- `city`
- `country`
- `cpf` (com constraint unique)
- `gdprAccepted`
- `lgpdAccepted`
- `passport` (com constraint unique)
- `personalDescription`
- `phone`
- `profileImage`
- `state`
- `termsAccepted`
- `twoFactorEnabled`
- `zipCode`

### 2. Query Corrigida

**Arquivo**: `src/auth.ts`

A query agora usa `select` para buscar apenas os campos necessários:

```typescript
const user = await prisma.user.findUnique({ 
  where: { email },
  select: {
    id: true,
    email: true,
    name: true,
    passwordHash: true,
    role: true,
    cpf: true,
    passport: true,
  }
});
```

Isso evita que o Prisma tente buscar campos que podem não existir.

---

## 🚀 Próximos Passos

### 1. Aplicar Migration

```bash
cd /Users/macbookpro/Projetos/tna-studio
npx prisma migrate deploy
```

### 2. Gerar Prisma Client

```bash
npx prisma generate
```

### 3. Reiniciar Servidor

```bash
# Parar servidor (Ctrl+C)
# Limpar cache
rm -rf .next node_modules/.cache

# Reiniciar
npm run dev
```

### 4. Testar Login

Acesse: http://localhost:3000/signin

**Credenciais**:
- `admin@tna.studio` / `Admin@2025!`
- `super@tna.studio` / `Super@2025!`
- `model1@tna.studio` / `Model1@2025!`
- `client1@tna.studio` / `Client1@2025!`
- `[redacted-email]` / `[redacted-password]`

---

## ✅ Verificação

Após aplicar a migration, o erro `The column User.acceptedAt does not exist` não deve mais aparecer.

---

**Status**: ✅ Migration criada e pronta para aplicar

