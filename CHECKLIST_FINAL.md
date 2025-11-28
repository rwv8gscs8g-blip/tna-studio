# Checklist Final - Recuperação do Banco

## ✅ Comandos para Executar

Execute na ordem abaixo:

```bash
# 1. Resetar banco completamente (apaga tudo e recria)
npx prisma migrate reset

# 2. Verificar status das migrations
npx prisma migrate status

# 3. Iniciar servidor
npm run dev
```

## ✅ Validações Manuais

Após executar os comandos:

- [ ] `npx prisma migrate reset` executado com sucesso
  - [ ] Mensagem: "✅ The database has been reset"
  - [ ] Mensagem: "Running seed command..."
  - [ ] Mensagem: "✅ Seed de usuários e produtos finalizado!"

- [ ] `npx prisma migrate status` mostra:
  - [ ] "Database schema is up to date!"

- [ ] Servidor inicia sem erros:
  - [ ] `npm run dev` roda sem erros
  - [ ] Nenhum erro de "table User does not exist"

- [ ] Testar login em `http://localhost:3000/signin`:
  - [ ] `arquiteto@tna.studio` / `Arquiteto@2025!` → Login OK
  - [ ] `admin@tna.studio` / `Admin@2025!` → Login OK
  - [ ] Redirecionamento correto após login

- [ ] Testar loja (após login como ARQUITETO):
  - [ ] Acessar `/loja` → Página carrega sem erros
  - [ ] 10 produtos aparecem (Pacote 1 a 10)
  - [ ] Clicar em um produto → Abre corretamente

## 🚨 Se Algo Der Errado

### Erro: "Migration already applied"
```bash
npx prisma migrate resolve --rolled-back 20251127053051_init_v2
npx prisma migrate deploy
npm run seed
```

### Erro: "Cannot find module"
```bash
npm install
```

### Erro: "Connection refused"
- Verifique `DATABASE_URL` no `.env.local`
- Verifique se o banco Neon está ativo

---

## 📋 Resumo do Diagnóstico

✅ **Schema Prisma:** Correto - model User existe (linha 385)
✅ **Migration:** Correta - CREATE TABLE "User" existe (linha 312)
✅ **Seed:** Correto - cria usuários com bcrypt.hash (compatível com auth.ts)
✅ **Auth.ts:** Correto - usa prisma.user.findUnique e bcrypt.compare

**Problema:** Drift - migration marcada como aplicada mas não executada no banco.

**Solução:** `npx prisma migrate reset` para resetar tudo e reaplicar do zero.

