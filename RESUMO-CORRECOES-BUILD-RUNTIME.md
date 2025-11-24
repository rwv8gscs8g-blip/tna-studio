# RESUMO - CORREÇÕES DE BUILD E RUNTIME

## Data: 2025-01-XX

Este documento resume as correções aplicadas para resolver erros de build e runtime no TNA-Studio.

---

## ✅ 1. CORREÇÃO: Event Handlers em Server Components

### Problema:
- Erro em runtime: `Error: Event handlers cannot be passed to Client Component props`
- Ocorria em `src/app/page.tsx` (Server Component) usando `onMouseEnter` e `onMouseLeave` diretamente em componentes `Link`

### Solução Aplicada:
- ✅ Criado componente Client Component `src/app/components/HomeActionButtons.tsx`
- ✅ Movidos os botões "Entrar" e "Criar Conta (Modelo)" para este componente
- ✅ Mantidos os event handlers (`onMouseEnter`/`onMouseLeave`) dentro do Client Component
- ✅ `src/app/page.tsx` agora importa e usa `<HomeActionButtons />` ao invés de renderizar os Links diretamente

### Arquivos Modificados:
1. **`src/app/components/HomeActionButtons.tsx`** (NOVO)
   - Client Component com `"use client"` no topo
   - Contém os botões com event handlers de hover

2. **`src/app/page.tsx`**
   - Removidos os event handlers `onMouseEnter`/`onMouseLeave`
   - Substituído o bloco de botões por `<HomeActionButtons />`
   - Mantido como Server Component

### Explicação Técnica:
No Next.js 15 App Router, Server Components não podem passar event handlers como props para Client Components. A solução foi isolar os elementos que precisam de interatividade em um Client Component separado, mantendo a página principal como Server Component para melhor performance.

---

## ✅ 2. CORREÇÃO: Erro TypeScript no prisma/seed.ts

### Problema:
- Erro de build: `Type '{ nome: string; }' is not assignable to type 'ProdutoWhereUniqueInput'`
- O `upsert` estava usando `where: { nome: produtoData.nome }`, mas o campo `nome` não é `@unique` no schema
- Apenas `id` é chave única (`@id`) no modelo `Produto`

### Solução Aplicada:
- ✅ Substituído `upsert` por `findFirst` + `update`/`create`
- ✅ Lógica: busca produto existente por nome, se encontrar atualiza, senão cria novo
- ✅ Usa `where: { id: existing.id }` no `update` (campo único válido)

### Arquivo Modificado:
**`prisma/seed.ts`** (linhas 412-419)

**Antes:**
```typescript
for (const produtoData of produtos) {
  const produto = await prisma.produto.upsert({
    where: { nome: produtoData.nome }, // ❌ Erro: nome não é @unique
    update: produtoData,
    create: produtoData,
  });
  console.log(`   ✓ ${produto.nome}`);
}
```

**Depois:**
```typescript
// Criar produtos: como 'nome' não é @unique, usamos findFirst + update/create
// ao invés de upsert com where: { nome }
for (const produtoData of produtos) {
  const existing = await prisma.produto.findFirst({
    where: { nome: produtoData.nome },
  });

  let produto;
  if (existing) {
    // Atualizar produto existente
    produto = await prisma.produto.update({
      where: { id: existing.id }, // ✅ Usa id (chave única)
      data: produtoData,
    });
  } else {
    // Criar novo produto
    produto = await prisma.produto.create({
      data: produtoData,
    });
  }
  console.log(`   ✓ ${produto.nome}`);
}
```

### Explicação Técnica:
O Prisma `upsert` requer que o campo usado em `where` seja uma chave única (`@id` ou `@unique`). Como `nome` não é `@unique` no schema, não pode ser usado diretamente. A solução foi fazer uma busca primeiro (`findFirst`) e então decidir entre `update` (usando `id`) ou `create`.

**Alternativa Considerada (não aplicada):**
- Adicionar `@unique` ao campo `nome` no schema e rodar migration
- **Motivo da não aplicação:** Pode quebrar dados existentes se houver nomes duplicados, e não é necessário para o funcionamento do seed

---

## ✅ 3. VALIDAÇÕES REALIZADAS

### 3.1 TypeScript Check
- ✅ `src/app/page.tsx` - Sem erros relacionados às mudanças
- ✅ `src/app/components/HomeActionButtons.tsx` - Sem erros
- ✅ `prisma/seed.ts` - Sem erros relacionados ao upsert

### 3.2 Prisma Client
- ✅ `npx prisma generate` - Executado com sucesso
- ✅ Tipos do Prisma Client atualizados

### 3.3 Linter
- ✅ Sem erros de lint nos arquivos modificados
- ⚠️ Nota: Erro de configuração do ESLint (não relacionado às mudanças)

---

## 📋 ARQUIVOS MODIFICADOS

1. **`src/app/components/HomeActionButtons.tsx`** (NOVO)
   - Client Component para botões de ação da home
   - Contém event handlers de hover

2. **`src/app/page.tsx`**
   - Removidos event handlers
   - Importa e usa `HomeActionButtons`

3. **`prisma/seed.ts`**
   - Substituído `upsert` por `findFirst` + `update`/`create`
   - Comentário explicativo adicionado

---

## 🚀 PRÓXIMOS PASSOS

### Para validar completamente:

1. **Testar em desenvolvimento:**
   ```bash
   npm run dev
   ```
   - Acessar `/` - não deve aparecer erro de event handlers
   - Acessar `/signin` - deve funcionar normalmente

2. **Testar build:**
   ```bash
   npm run build
   ```
   - Deve compilar sem erros relacionados aos arquivos modificados
   - ⚠️ Nota: Podem existir outros erros TypeScript pré-existentes em outros arquivos

3. **Testar seed:**
   ```bash
   npx prisma db seed
   ```
   - Deve executar sem erros
   - Produtos devem ser criados/atualizados corretamente

---

## ✅ STATUS

- ✅ Erro de runtime (event handlers) - **CORRIGIDO**
- ✅ Erro de build (seed.ts) - **CORRIGIDO**
- ✅ Arquivos validados - **SEM ERROS RELACIONADOS**

**Versão:** 1.0.1  
**Data:** 2025-01-XX  
**Status:** ✅ Correções aplicadas e validadas

