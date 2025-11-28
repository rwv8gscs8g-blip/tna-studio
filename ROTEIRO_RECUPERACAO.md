# Roteiro de Recuperação - Banco Neon TNA Studio

## 🔍 Diagnóstico

**Problema identificado:**
- ✅ Migration `20251127053051_init_v2` contém `CREATE TABLE "User"` (linha 312)
- ❌ Migration foi marcada como aplicada em `_prisma_migrations`, mas não foi executada no banco
- ❌ Tabela `User` não existe no banco (drift)

**Causa:**
A migration foi registrada como aplicada, mas falhou silenciosamente ou o banco foi resetado parcialmente.

## ✅ Solução: Resetar Banco e Reaplicar Migrations

### Passo 1: Resetar Completamente o Banco

```bash
# Parar servidor dev (se estiver rodando)
# Ctrl + C

# Resetar banco (apaga TODOS os dados e recria do zero)
npx prisma migrate reset
```

**O que faz:**
- Apaga todas as tabelas
- Limpa `_prisma_migrations`
- Aplica todas as migrations do zero
- Roda o seed automaticamente

**Resultado esperado:**
```
✔ Are you sure you want to reset your database? All data will be lost. › yes
Environment variables loaded from .env.local
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "neondb", schema "public" at "ep-raspy-firefly-acqce8tz-pooler.sa-east-1.aws.neon.tech"

Applying migration `20251127053051_init_v2`
✅ The database has been reset.
Running seed command `tsx prisma/seed.ts`...
🌱 Iniciando seed de usuários...
...
✅ Seed de usuários e produtos finalizado!
```

### Passo 2: Verificar Status

```bash
# Verificar se migrations foram aplicadas
npx prisma migrate status
```

**Resultado esperado:**
```
Database schema is up to date!
```

### Passo 3: Verificar Tabelas (Opcional)

```bash
# Abrir Prisma Studio para verificar tabelas
npx prisma studio
```

**Verificar manualmente:**
- Tabela `User` existe com 5 registros
- Tabela `Produto` existe com 10 registros
- Todos os campos estão corretos

### Passo 4: Iniciar Servidor

```bash
npm run dev
```

### Passo 5: Testar Login

1. Acesse `http://localhost:3000/signin`
2. Teste login:
   - **ARQUITETO:** `arquiteto@tna.studio` / `Arquiteto@2025!`
   - **ADMIN:** `admin@tna.studio` / `Admin@2025!`

---

## 🔄 Alternativa: Se `migrate reset` não funcionar

Se o `migrate reset` falhar ou não resolver, use `db push`:

```bash
# Forçar sincronização do schema (ignora migrations)
npx prisma db push --force-reset

# Rodar seed manualmente
npm run seed
```

**⚠️ Atenção:** `db push` não cria migrations, apenas sincroniza o schema. Use apenas se `migrate reset` não funcionar.

---

## 📝 Checklist Final

Após executar os comandos acima:

- [ ] `npx prisma migrate reset` executado com sucesso
- [ ] Seed rodou e criou 5 usuários
- [ ] Seed rodou e criou 10 produtos
- [ ] `npx prisma migrate status` mostra "Database schema is up to date!"
- [ ] Servidor inicia sem erros (`npm run dev`)
- [ ] Login como `arquiteto@tna.studio` funciona
- [ ] Login como `admin@tna.studio` funciona
- [ ] Página `/loja` abre sem erros
- [ ] Nenhum erro de "table User does not exist" no console

---

## 🚨 Troubleshooting

### Erro: "Migration already applied"
```bash
# Marcar migration como não aplicada
npx prisma migrate resolve --rolled-back 20251127053051_init_v2

# Aplicar novamente
npx prisma migrate deploy
```

### Erro: "Cannot find module 'tsx'"
```bash
# Instalar dependências
npm install
```

### Erro no seed: "Unique constraint failed"
- O seed usa `upsert`, então pode rodar múltiplas vezes
- Se persistir, limpe as tabelas manualmente no Prisma Studio

### Erro: "Connection refused" ou "timeout"
- Verifique se `DATABASE_URL` no `.env.local` está correto
- Verifique se o banco Neon está ativo no painel

---

## ✅ Validação Final

Execute estes comandos para confirmar que tudo está OK:

```bash
# 1. Verificar migrations
npx prisma migrate status

# 2. Verificar se tabelas existem (via Prisma Studio)
npx prisma studio
# Abra http://localhost:5555 e verifique:
# - Tabela User com 5 registros
# - Tabela Produto com 10 registros

# 3. Testar conexão
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"User\";"
# Deve retornar: 5
```

