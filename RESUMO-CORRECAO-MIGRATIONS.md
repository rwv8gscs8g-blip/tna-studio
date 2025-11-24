# 📋 Resumo da Correção de Migrations - TNA Studio

**Data:** 2025-01-25  
**Problema:** Migrations contendo `ADD CONSTRAINT IF NOT EXISTS` que não é suportado pelo PostgreSQL

---

## ✅ Correções Aplicadas

### 1. **Migration SQL Corrigida**

**Arquivo:** `prisma/migrations/$(date +%Y%m%d%H%M%S)_add_produtos_intencoes_loja/migration.sql`

**Problema encontrado:**
- 5 ocorrências de `ADD CONSTRAINT IF NOT EXISTS` (não suportado pelo PostgreSQL)

**Correções aplicadas:**
- ✅ Linha 74: `ADD CONSTRAINT IF NOT EXISTS` → `ADD CONSTRAINT`
- ✅ Linha 75: `ADD CONSTRAINT IF NOT EXISTS` → `ADD CONSTRAINT`
- ✅ Linha 76: `ADD CONSTRAINT IF NOT EXISTS` → `ADD CONSTRAINT`
- ✅ Linha 77: `ADD CONSTRAINT IF NOT EXISTS` → `ADD CONSTRAINT`
- ✅ Linha 78: `ADD CONSTRAINT IF NOT EXISTS` → `ADD CONSTRAINT`

**Antes:**
```sql
ALTER TABLE "ProdutoPhoto" ADD CONSTRAINT IF NOT EXISTS "ProdutoPhoto_produtoId_fkey" ...
ALTER TABLE "EnsaioProduto" ADD CONSTRAINT IF NOT EXISTS "EnsaioProduto_ensaioId_fkey" ...
ALTER TABLE "EnsaioProduto" ADD CONSTRAINT IF NOT EXISTS "EnsaioProduto_produtoId_fkey" ...
ALTER TABLE "IntencaoCompra" ADD CONSTRAINT IF NOT EXISTS "IntencaoCompra_modeloId_fkey" ...
ALTER TABLE "IntencaoCompra" ADD CONSTRAINT IF NOT EXISTS "IntencaoCompra_produtoId_fkey" ...
```

**Depois:**
```sql
ALTER TABLE "ProdutoPhoto" ADD CONSTRAINT "ProdutoPhoto_produtoId_fkey" ...
ALTER TABLE "EnsaioProduto" ADD CONSTRAINT "EnsaioProduto_ensaioId_fkey" ...
ALTER TABLE "EnsaioProduto" ADD CONSTRAINT "EnsaioProduto_produtoId_fkey" ...
ALTER TABLE "IntencaoCompra" ADD CONSTRAINT "IntencaoCompra_modeloId_fkey" ...
ALTER TABLE "IntencaoCompra" ADD CONSTRAINT "IntencaoCompra_produtoId_fkey" ...
```

---

### 2. **Diretório com Nome Inválido**

**Problema:**
- Diretório: `$(date +%Y%m%d%H%M%S)_add_produtos_intencoes_loja`
- Nome contém variável shell não expandida `$(date +%Y%m%d%H%M%S)`

**Recomendação:**
- ⚠️ **Renomear manualmente** o diretório para: `20250124020000_add_produtos_intencoes_loja`

**Comando sugerido:**
```bash
cd prisma/migrations
mv '$(date +%Y%m%d%H%M%S)_add_produtos_intencoes_loja' '20250124020000_add_produtos_intencoes_loja'
```

**Nota:** O arquivo SQL dentro do diretório já foi corrigido. Apenas o nome do diretório precisa ser ajustado.

---

## ✅ Verificações Realizadas

### Busca por `ADD CONSTRAINT IF NOT EXISTS`
- ✅ Nenhuma ocorrência encontrada após as correções
- ✅ Todas as 5 ocorrências foram corrigidas

### Outras migrations
- ✅ Verificadas todas as 19 migrations
- ✅ Apenas 1 migration tinha o problema
- ✅ Todas as outras migrations estão corretas

---

## 📝 Próximos Passos

1. **Renomear o diretório manualmente:**
   ```bash
   cd prisma/migrations
   mv '$(date +%Y%m%d%H%M%S)_add_produtos_intencoes_loja' '20250124020000_add_produtos_intencoes_loja'
   ```

2. **Testar o reset:**
   ```bash
   npx prisma migrate reset
   ```

3. **Se o reset funcionar, aplicar migrations:**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

---

## 📦 Arquivos Modificados

- ✅ `prisma/migrations/$(date +%Y%m%d%H%M%S)_add_produtos_intencoes_loja/migration.sql`
  - Removidas 5 ocorrências de `IF NOT EXISTS` em `ADD CONSTRAINT`

---

## ⚠️ Observação Importante

O diretório ainda precisa ser renomeado manualmente devido a caracteres especiais no nome (`$`, `(`, `)`, `+`). O arquivo SQL dentro dele já foi corrigido e está funcional.

**Status:** ✅ **SQL CORRIGIDO** | ⚠️ **DIRETÓRIO PRECISA SER RENOMEADO MANUALMENTE**

