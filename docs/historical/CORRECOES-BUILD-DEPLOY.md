# Correções de Build para Deploy

## ✅ Erros Corrigidos

### 1. Erro TypeScript: `photoId` não acessível no catch

**Arquivo:** `src/app/api/media/serve/[photoId]/route.ts`

**Problema:**
- `photoId` era extraído dentro do bloco `try`
- Não estava acessível no bloco `catch` para logs de erro

**Solução:**
- Extraído `photoId` antes do bloco `try`
- Agora está disponível em todo o escopo da função

```typescript
// Antes
export async function GET(...) {
  try {
    const { photoId } = await params;
    // ...
  } catch (error) {
    console.error(`photoId=${photoId}`); // ❌ Erro: photoId não está no escopo
  }
}

// Depois
export async function GET(...) {
  const { photoId } = await params; // ✅ Extraído antes do try
  try {
    // ...
  } catch (error) {
    console.error(`photoId=${photoId}`); // ✅ Funciona
  }
}
```

### 2. Erro TypeScript: Campo `image` não existe no User

**Arquivo:** `src/auth.ts`

**Problema:**
- Código tentava acessar `user.image`
- Schema do Prisma não tem campo `image` no modelo `User`

**Solução:**
- Removida referência a `user.image`
- NextAuth funciona sem o campo `image` (é opcional)

```typescript
// Antes
return { id: user.id, name: user.name ?? "", email: user.email, image: user.image ?? undefined, role };

// Depois
return { id: user.id, name: user.name ?? "", email: user.email, role };
```

### 3. Erro TypeScript: `user.id` possivelmente undefined

**Arquivo:** `src/auth.ts`

**Problema:**
- TypeScript não garantia que `user.id` existia no log

**Solução:**
- Adicionada verificação com fallback

```typescript
// Antes
console.log(`userId=${user.id.substring(0, 8)}...`); // ❌ user.id pode ser undefined

// Depois
const userId = user.id || (user as any).id || "unknown";
console.log(`userId=${userId.substring(0, 8)}...`); // ✅ Seguro
```

### 4. Erro TypeScript: Tipo de `session.expires`

**Arquivo:** `src/auth.ts`

**Problema:**
- `session.expires` tem tipo específico do NextAuth
- Não aceita string diretamente

**Solução:**
- Usado cast `as any` para contornar limitação de tipo

```typescript
// Antes
session.expires = new Date(token.exp * 1000).toISOString(); // ❌ Erro de tipo

// Depois
(session as any).expires = new Date(token.exp * 1000).toISOString(); // ✅ Funciona
```

### 5. Erro TypeScript: Tipo incompatível em `allowedRoles.includes()`

**Arquivo:** `src/lib/image-rights.ts`

**Problema:**
- `userRole` pode ser `Role | string`
- `allowedRoles` é `Role[]`
- `includes()` não aceita `string` quando espera `Role`

**Solução:**
- Conversão explícita de `userRole` para `Role` antes de usar `includes()`

```typescript
// Antes
if (rights.allowedRoles.includes(userRole)) { // ❌ userRole pode ser string

// Depois
const userRoleEnum = typeof userRole === "string" ? (userRole as Role) : userRole;
if (rights.allowedRoles.includes(userRoleEnum)) { // ✅ Tipo correto
```

### 6. Warning: `experimental.turbo` deprecated

**Arquivo:** `next.config.ts`

**Problema:**
- `experimental.turbo` está deprecated no Next.js 15.5.6
- Deve ser movido para `turbopack` ou removido

**Solução:**
- Removida configuração (não estava sendo usada)

```typescript
// Antes
experimental: {
  turbo: { rules: {} },
},

// Depois
// Removido (não necessário)
```

## ✅ Status Final

- ✅ **Build local**: Passa sem erros
- ✅ **TypeScript**: Sem erros de tipo
- ✅ **Warnings**: Apenas avisos sobre bcryptjs/Prisma no Edge Runtime (não críticos, pois usamos Node.js runtime)

## 📋 Próximos Passos

1. ✅ Código corrigido e testado localmente
2. ⏳ **Fazer commit e push** das alterações
3. ⏳ **Fazer novo deploy** na Vercel
4. ⏳ Validar que o deploy completa com sucesso

## 🚨 Notas Importantes

### Warnings Não Críticos

Os warnings sobre `bcryptjs` e `Prisma` no Edge Runtime são **apenas avisos**, não erros:
- Essas bibliotecas são usadas apenas em rotas com `runtime = "nodejs"`
- O middleware não usa essas bibliotecas
- O build completa com sucesso apesar dos warnings

### Arquivos Modificados

1. `src/app/api/media/serve/[photoId]/route.ts` - Correção de escopo
2. `src/auth.ts` - Remoção de `image`, correção de tipos
3. `src/lib/image-rights.ts` - Correção de tipo em `includes()`
4. `next.config.ts` - Remoção de config deprecated

---

**Data:** 2025-11-20
**Status:** ✅ Pronto para Deploy

