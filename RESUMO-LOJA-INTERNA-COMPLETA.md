# RESUMO - LOJA INTERNA TNA-STUDIO - VERSÃO 1.0 COMPLETA

## Data: 2025-01-XX

Este documento resume todas as alterações realizadas para implementar a loja interna completa do TNA-Studio, incluindo sistema de produtos, projetos, área da modelo e associações.

---

## ✅ 1. MODELO DE DADOS - SCHEMA PRISMA ATUALIZADO

### Arquivos Modificados:
- `prisma/schema.prisma`

### Alterações:

#### A. Enum EnsaioStatus
```prisma
enum EnsaioStatus {
  DRAFT
  PUBLISHED
}
```

#### B. Model Produto
```prisma
model Produto {
  id          String          @id @default(cuid())
  nome        String
  descricao   String?
  preco       Float
  categoria   String?
  isPromocao  Boolean         @default(false)
  isTfp       Boolean         @default(false)
  coverImageKey String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  ensaios     EnsaioProduto[]
  photos      ProdutoPhoto[]
  intencoes   IntencaoCompra[]
}
```

#### C. Model ProdutoPhoto
```prisma
model ProdutoPhoto {
  id         String   @id @default(cuid())
  produtoId  String
  produto    Produto  @relation(...)
  storageKey String
  sortOrder  Int      @default(0)
  createdAt  DateTime @default(now())
}
```

#### D. Model EnsaioProduto (N:N)
```prisma
model EnsaioProduto {
  id        String   @id @default(cuid())
  ensaioId  String
  produtoId String
  ensaio    Ensaio   @relation(...)
  produto   Produto  @relation(...)
  createdAt DateTime @default(now())
  @@unique([ensaioId, produtoId])
}
```

#### E. Model IntencaoCompra
```prisma
model IntencaoCompra {
  id        String   @id @default(cuid())
  modeloId  String
  produtoId String
  status    String   @default("PENDENTE")
  produto   Produto  @relation(...)
  modelo    User     @relation("IntencoesCompra", ...)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### F. Atualização do Model Ensaio
- Campo `status` alterado para `EnsaioStatus` enum
- Campo `d4signDocumentId` adicionado
- Relação `produtos` adicionada (via `EnsaioProduto`)

---

## ✅ 2. ROTAS DA LOJA CRIADAS

### Arquivos Criados:

1. **`src/app/loja/page.tsx`**
   - Listagem de produtos em grid responsivo
   - Seção especial para TFP/Permuta (destaque)
   - Seção de promoções
   - Seção de produtos normais

2. **`src/app/loja/produto/[id]/page.tsx`**
   - Página de detalhe do produto
   - Exibe capa, mini-galeria (5 fotos), descrição, contrapartidas
   - Botão "Quero este produto" para MODELO
   - Estatísticas (ensaios realizados, intenções de compra)

3. **`src/app/loja/produto/[id]/components/ProductDetailClient.tsx`**
   - Componente client-side para detalhe do produto
   - Upload de imagens via URLs assinadas
   - Criação de intenção de compra

---

## ✅ 3. COMPONENTES REUTILIZÁVEIS CRIADOS

### Arquivos Criados:

1. **`src/app/components/ProductCard.tsx`**
   - Card de produto para grid
   - Exibe capa, nome, preço, badges (TFP/Promoção)
   - Link para detalhe do produto

2. **`src/app/components/ProjectBadge.tsx`**
   - Badge para exibir projetos associados
   - Suporta onClick opcional

---

## ✅ 4. APIS CRIADAS

### Arquivos Criados:

1. **`src/app/api/produtos/route.ts`**
   - `GET /api/produtos` - Lista produtos (com filtros: categoria, promocao, tfp)
   - `POST /api/produtos` - Cria produto (apenas ARQUITETO)

2. **`src/app/api/produtos/[id]/route.ts`**
   - `GET /api/produtos/[id]` - Busca produto por ID
   - `PATCH /api/produtos/[id]` - Atualiza produto (apenas ARQUITETO)
   - `DELETE /api/produtos/[id]` - Remove produto (apenas ARQUITETO)

3. **`src/app/api/produtos/[id]/cover/route.ts`**
   - `GET /api/produtos/[id]/cover` - Retorna URL assinada da capa do produto

4. **`src/app/api/produtos/[id]/photos/[photoId]/route.ts`**
   - `GET /api/produtos/[id]/photos/[photoId]` - Retorna URL assinada de uma foto do produto

5. **`src/app/api/intencoes/route.ts`**
   - `GET /api/intencoes?modeloId=xyz` - Lista intenções (filtrado por modelo se fornecido)
   - `POST /api/intencoes` - Cria intenção de compra (apenas MODELO)

6. **`src/app/api/projetos/[id]/route.ts`** (atualizado)
   - `GET /api/projetos/[id]` - Busca projeto por ID
   - `PATCH /api/projetos/[id]` - Atualiza projeto (apenas ARQUITETO)
   - `DELETE /api/projetos/[id]` - Remove projeto (apenas ARQUITETO)

---

## ✅ 5. CRIAÇÃO DE ENSAIO ATUALIZADA

### Arquivo Modificado:
- `src/app/arquiteto/ensaios/components/CreateEnsaioForm.tsx`

### Alterações:
- ✅ Campo de busca inteligente de modelos (já existia via `UserSearchField`)
- ✅ Campo "Data do ensaio" (já existia)
- ✅ Campo "Nome do ensaio" (já existia)
- ✅ **NOVO:** Seleção MULTISELECT de produtos
- ✅ Seleção MULTISELECT de projetos (já existia)
- ✅ Upload de foto de capa (já existia)
- ✅ Upload de termo PDF (já existia)
- ✅ **NOVO:** Upload de mini-galeria (até 5 fotos)
- ✅ Campo link Sync.com (já existia)
- ✅ Campo `d4signDocumentId` (preparado no schema)

### Arquivo Modificado:
- `src/app/api/arquiteto/ensaios/route.ts`

### Alterações:
- Aceita `produtoIds` no body
- Aceita `miniGalleryKeys` no body
- Cria associações N:N via `EnsaioProduto`
- Cria fotos da mini-galeria via `EnsaioPhoto`

---

## ✅ 6. LISTAGEM DE ENSAIOS REFATORADA

### Arquivos Modificados:
- `src/app/arquiteto/ensaios/page.tsx`
- `src/app/arquiteto/ensaios/components/EnsaiosListClient.tsx`

### Alterações:
- ✅ Grid 3 colunas responsivo (já existia)
- ✅ Paginação 50 por página (já existia)
- ✅ **NOVO:** Filtro por projeto
- ✅ **NOVO:** Filtro por produto
- ✅ Filtro por modelo (já existia)
- ✅ Filtro por status (DRAFT/PUBLISHED)
- ✅ **NOVO:** Selos de projetos nos cards
- ✅ **NOVO:** Selos de produtos nos cards
- ✅ Exibe capa, nome, data, modelo, status do termo

---

## ✅ 7. PÁGINA DE DETALHE DO ENSAIO ATUALIZADA

### Arquivo Modificado:
- `src/app/arquiteto/ensaios/[id]/page.tsx`

### Alterações:
- ✅ Exibe projetos associados (badges)
- ✅ Exibe produtos associados (badges com preço/TFP)
- ✅ Exibe capa, termo, mini-galeria
- ✅ Link Sync.com
- ✅ Botões D4Sign (Em breve)

---

## ✅ 8. ÁREA INTERNA DA MODELO

### Arquivos Criados:

1. **`src/app/modelo/home/page.tsx`**
   - Painel visual da modelo
   - Foto de perfil (ou inicial)
   - Nome, e-mail, CPF, idade
   - Estatísticas (ensaios publicados, intenções pendentes)
   - Botões de ação rápida:
     - 📸 Meus Ensaios
     - 🛍️ Loja TNA
     - 📁 Projetos que participo
     - 💼 Meus contratos
     - ✨ Magic Login (em breve)

2. **`src/app/modelo/intencoes/page.tsx`**
   - Listagem de intenções de compra da modelo
   - Status (PENDENTE, APROVADA, REJEITADA, CONCLUIDA)
   - Link para produto
   - Data de solicitação

### Arquivo Modificado:
- `src/app/components/Navigation.tsx`
   - Links adicionados para MODELO:
     - Home
     - Meus Ensaios
     - Loja
     - Projetos

---

## ✅ 9. SISTEMA DE PROJETOS COMPLETO

### Arquivos Criados:

1. **`src/app/projetos/page.tsx`** (já existia, mantido)
   - Listagem de projetos
   - Botão "Novo Projeto" (ARQUITETO)
   - Botão "Editar" (ARQUITETO)

2. **`src/app/projetos/new/page.tsx`**
   - Página de criação de projeto

3. **`src/app/projetos/new/components/CreateProjetoForm.tsx`**
   - Formulário de criação de projeto

4. **`src/app/projetos/[id]/edit/page.tsx`**
   - Página de edição de projeto

5. **`src/app/projetos/[id]/edit/components/EditProjetoForm.tsx`**
   - Formulário de edição de projeto

---

## ✅ 10. SEED COM 10 PRODUTOS

### Arquivo Modificado:
- `prisma/seed.ts`

### Produtos Criados:

1. **Pacote 1 - Ensaio Básico** - R$ 500,00
2. **Pacote 2 - Ensaio Completo** - R$ 900,00
3. **Pacote 3 - Ensaio Premium** - R$ 1.500,00
4. **Pacote 4 - Ensaio Fashion** - R$ 1.800,00
5. **Pacote 5 - Ensaio Boudoir** - R$ 2.000,00
6. **Pacote 6 - Ensaio Externo** - R$ 2.200,00
7. **Pacote 7 - Ensaio Corporativo** - R$ 1.200,00
8. **Pacote 8 - Ensaio Artístico** - R$ 2.500,00
9. **Pacote 9 - Ensaio VIP** - R$ 3.500,00 (Promoção)
10. **Pacote 10 - TFP / Permuta** - R$ 0,00 (TFP, Promoção, Destaque)

---

## ✅ 11. UPLOADS SEGUROS E URLs ASSINADAS

### Arquivos Criados/Modificados:

1. **`src/app/api/ensaios/upload/route.ts`**
   - Upload de capa, termo, fotos
   - Validação: máximo 3 MB
   - Tipos permitidos: JPEG, WebP, PNG (imagens), PDF (termo)
   - Armazenamento no R2 com chaves seguras

2. **`src/app/api/produtos/[id]/cover/route.ts`**
   - Gera URL assinada da capa do produto (expiração 60-120s)

3. **`src/app/api/produtos/[id]/photos/[photoId]/route.ts`**
   - Gera URL assinada de foto do produto (expiração 60-120s)

### Garantias:
- ✅ Nunca expor URLs reais no HTML do servidor
- ✅ Sempre gerar URL assinada via API protegida
- ✅ Expiração entre 60 e 120 segundos
- ✅ Headers: `Cache-Control: no-store, private`

---

## ✅ 12. MIGRATION APLICADA

### Arquivo Criado:
- `prisma/migrations/20251122161655_add_produtos_intencoes_loja/migration.sql`
- `scripts/apply-produtos-migration.ts` (script de aplicação manual)

### Status:
- ✅ Migration criada
- ✅ Migration aplicada no banco de dados
- ✅ Prisma Client regenerado

---

## 📋 ARQUIVOS MODIFICADOS/CRIADOS

### Schema e Migrations:
1. `prisma/schema.prisma` - Atualizado com Produto, IntencaoCompra, EnsaioProduto, ProdutoPhoto, EnsaioStatus
2. `prisma/migrations/20251122161655_add_produtos_intencoes_loja/migration.sql` - Migration SQL
3. `prisma/seed.ts` - Adicionados 10 produtos
4. `scripts/apply-produtos-migration.ts` - Script de aplicação manual

### APIs:
5. `src/app/api/produtos/route.ts` - GET/POST produtos
6. `src/app/api/produtos/[id]/route.ts` - GET/PATCH/DELETE produto
7. `src/app/api/produtos/[id]/cover/route.ts` - URL assinada da capa
8. `src/app/api/produtos/[id]/photos/[photoId]/route.ts` - URL assinada de foto
9. `src/app/api/intencoes/route.ts` - GET/POST intenções
10. `src/app/api/projetos/[id]/route.ts` - GET/PATCH/DELETE projeto (atualizado)
11. `src/app/api/arquiteto/ensaios/route.ts` - Atualizado para aceitar produtos e mini-galeria

### Componentes:
12. `src/app/components/ProductCard.tsx` - Card de produto
13. `src/app/components/ProjectBadge.tsx` - Badge de projeto

### Páginas:
14. `src/app/loja/page.tsx` - Listagem de produtos
15. `src/app/loja/produto/[id]/page.tsx` - Detalhe do produto
16. `src/app/loja/produto/[id]/components/ProductDetailClient.tsx` - Componente client do detalhe
17. `src/app/modelo/home/page.tsx` - Home da modelo
18. `src/app/modelo/intencoes/page.tsx` - Intenções de compra da modelo
19. `src/app/projetos/new/page.tsx` - Criar projeto
20. `src/app/projetos/new/components/CreateProjetoForm.tsx` - Formulário criar projeto
21. `src/app/projetos/[id]/edit/page.tsx` - Editar projeto
22. `src/app/projetos/[id]/edit/components/EditProjetoForm.tsx` - Formulário editar projeto

### Páginas Modificadas:
23. `src/app/arquiteto/ensaios/components/CreateEnsaioForm.tsx` - Adicionados produtos e mini-galeria
24. `src/app/arquiteto/ensaios/page.tsx` - Adicionados filtros por projeto e produto
25. `src/app/arquiteto/ensaios/components/EnsaiosListClient.tsx` - Adicionados filtros e selos
26. `src/app/arquiteto/ensaios/[id]/page.tsx` - Adicionados projetos e produtos
27. `src/app/components/Navigation.tsx` - Adicionados links para MODELO

---

## 🚀 PRÓXIMOS PASSOS

1. **Executar seed:**
   ```bash
   npx prisma db seed
   ```

2. **Testes Manuais:**
   - [ ] Login como ARQUITETO
   - [ ] Criar projeto
   - [ ] Criar produto
   - [ ] Criar ensaio com produtos e projetos
   - [ ] Verificar listagem com filtros
   - [ ] Login como MODELO
   - [ ] Acessar /modelo/home
   - [ ] Navegar pela loja
   - [ ] Criar intenção de compra
   - [ ] Verificar intenções em /modelo/intencoes

3. **Verificações:**
   - [ ] URLs assinadas funcionando (expiração 60-120s)
   - [ ] Uploads funcionando (capa, termo, mini-galeria)
   - [ ] Filtros funcionando na listagem de ensaios
   - [ ] Selos de projetos e produtos aparecendo nos cards

---

## ✅ ENTREGÁVEL FINAL

- ✅ Loja interna funcional (`/loja`)
- ✅ Interface da modelo renovada (`/modelo/home`)
- ✅ Sistema completo de projetos
- ✅ Sistema completo de produtos (10 pacotes no seed)
- ✅ Associação Produto ↔ Projeto ↔ Ensaio (N:N)
- ✅ Páginas de detalhe renovadas
- ✅ Uploads seguros via R2
- ✅ URLs assinadas (60-120s de expiração)
- ✅ Preparado para D4Sign (`d4signDocumentId` no schema)
- ✅ Preparado para Magic Login (página `/magic` já existe)
- ✅ Seed com 10 produtos

---

**Versão:** 1.0.0  
**Status:** ✅ Completo (pendente testes manuais finais)

