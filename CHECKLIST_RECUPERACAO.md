# Checklist de Recuperação do Banco - TNA Studio

## ✅ Passo 1: Preparação

- [ ] Criar novo database no Neon (ou resetar o atual)
- [ ] Copiar DATABASE_URL e DIRECT_URL do novo database
- [ ] Atualizar `.env.local` com as novas URLs
- [ ] Parar servidor dev (Ctrl + C)

## ✅ Passo 2: Aplicar Migrations

Execute no terminal:

```bash
# 1. Limpar migrations antigas (se houver)
rm -rf prisma/migrations/*

# 2. Gerar Prisma Client
npx prisma generate

# 3. Criar migration inicial
npx prisma migrate dev --name init_v2

# 4. Verificar status
npx prisma migrate status
```

**Resultado esperado:**
- ✅ Migration `init_v2` criada e aplicada
- ✅ Todas as tabelas criadas (User, Produto, Ensaio, etc.)

## ✅ Passo 3: Popular Dados (Seed)

```bash
npm run seed
```

**Resultado esperado:**
- ✅ 5 usuários criados:
  - `arquiteto@tna.studio` / `Arquiteto@2025!` (ARQUITETO)
  - `admin@tna.studio` / `Admin@2025!` (ADMIN)
  - `modelo@tna.studio` / `Modelo@2025!` (MODELO)
  - `cliente@tna.studio` / `Cliente@2025!` (CLIENTE)
  - `superadmin@tna.studio` / `SuperAdmin@2025!` (SUPERADMIN)
- ✅ 10 produtos criados (Pacote 1 a 10) com slugs

## ✅ Passo 4: Verificar Login

1. Iniciar servidor:
```bash
npm run dev
```

2. Acessar `/signin`

3. Testar login:
   - [ ] `arquiteto@tna.studio` / `Arquiteto@2025!` → Login OK
   - [ ] `admin@tna.studio` / `Admin@2025!` → Login OK
   - [ ] Redirecionamento correto após login

## ✅ Passo 5: Verificar Loja

Após login como ARQUITETO:

1. Acessar `/loja`
   - [ ] Página carrega sem erros
   - [ ] 10 produtos aparecem (Pacote 1 a 10)
   - [ ] Produtos organizados por categoria (Book, Serviço, Cortesia)

2. Clicar em um produto
   - [ ] Produto abre corretamente (via slug `/loja/[slug]`)
   - [ ] Detalhes do produto aparecem
   - [ ] Preço formatado em EUR
   - [ ] Descrição completa aparece

3. Verificar console do navegador
   - [ ] Nenhum erro de "relation Produto does not exist"
   - [ ] Nenhum erro de "table User does not exist"
   - [ ] Nenhum erro de migrations

## ✅ Passo 6: Verificar Build

```bash
npm run build
```

**Resultado esperado:**
- ✅ Build passa sem erros TypeScript
- ✅ Nenhum erro de tipo relacionado a Produto.slug
- ✅ Nenhum erro de tipo relacionado a User

## ✅ Passo 7: Verificar Banco (Opcional)

```bash
npx prisma studio
```

Verificar manualmente:
- [ ] Tabela `User` existe com 5 registros
- [ ] Tabela `Produto` existe com 10 registros
- [ ] Campo `slug` existe e é único em `Produto`
- [ ] Campo `precoEuro` existe em `Produto`
- [ ] Campo `shortDescription` e `fullDescription` existem

---

## 🚨 Troubleshooting

### Erro: "Migration already applied"
```bash
npx prisma migrate resolve --applied 20250125000000_v2_store_projects
npx prisma migrate dev --name init_v2
```

### Erro: "Table does not exist"
- Verifique se DATABASE_URL está correto
- Execute `npx prisma migrate dev --name init_v2` novamente

### Erro no seed: "Unique constraint failed"
- O seed usa `upsert`, então pode rodar múltiplas vezes
- Se persistir, limpe as tabelas manualmente no Prisma Studio

### Erro: "Produto.slug is required"
- Verifique se o seed gerou slugs corretamente
- Execute `npm run seed` novamente

---

## 📝 Notas Finais

- ✅ Schema Prisma está atualizado para V2
- ✅ Seed está atualizado para usar slug
- ✅ Rota `/loja/[slug]` criada
- ✅ ProductCard usa slug quando disponível
- ✅ Auth.ts usa bcrypt.compare (compatível com seed)

**Próximos passos após recuperação:**
- Implementar gestão ARQUITETO de produtos (`/arquiteto/produtos`)
- Implementar módulo Projetos
- Implementar histórico unificado (MODELO/CLIENTE)

