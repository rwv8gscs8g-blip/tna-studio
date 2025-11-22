# ⚠️ INSTRUÇÕES CRÍTICAS - Atualizar DATABASE_URL

## Situação Atual

O arquivo `.env.local` está apontando para o banco **errado**:
- **Banco atual:** `ep-raspy-firefly-acqce8tz-pooler.sa-east-1.aws.neon.tech/neondb` (projeto tna_studio)
- **Banco correto:** Projeto `dev-localhost` no Neon

## Ação Necessária

**Você precisa atualizar manualmente o arquivo `.env.local`** com a connection string do banco `dev-localhost`:

1. Acesse o painel do Neon
2. Entre no projeto `dev-localhost`
3. Copie a connection string (formato pooler ou direct)
4. Atualize `.env.local`:

```env
# BANCO CORRETO (dev-localhost)
DATABASE_URL="postgresql://USER:PASSWORD@HOST/dev-localhost?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST/dev-localhost?sslmode=require"
```

## Verificação

Após atualizar, execute:

```bash
npm run debug:db
```

Deve mostrar o banco `dev-localhost` na saída.

---

**Este arquivo pode ser removido após a correção ser aplicada.**

