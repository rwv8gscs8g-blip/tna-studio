# Validação e Unificação do Banco de Dados

**Data**: 2025-01-20  
**Status**: ⚠️ Requer Ação

---

## 🔍 Problema Identificado

**Sintoma**: 
- Usuário `admin@tna.studio` possui galerias em produção (`tna-studio.vercel.app`)
- Mesmo usuário não possui galerias em localhost
- **Indicativo**: Banco de dados não está unificado

---

## ✅ Solução: Banco de Dados Único

### 1. Configuração Atual

**Arquivo**: `.env.local` (localhost) e variáveis de ambiente Vercel (produção)

```env
# Deve apontar para o MESMO banco Neon
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

### 2. Verificação

**Execute em localhost**:
```bash
# Verificar qual banco está sendo usado
echo $DATABASE_URL

# Verificar conexão
npx prisma db pull
```

**Execute na Vercel**:
1. Acesse: https://vercel.com/dashboard
2. Projeto: `tna-studio`
3. Settings → Environment Variables
4. Verifique `DATABASE_URL` e `DIRECT_URL`
5. **Devem ser IDÊNTICOS aos do `.env.local`**

---

## 🔧 Passos para Unificar

### Opção A: Usar Banco de Produção (Recomendado)

1. **Copiar DATABASE_URL da Vercel**:
   - Vercel Dashboard → Settings → Environment Variables
   - Copiar `DATABASE_URL` e `DIRECT_URL`

2. **Atualizar `.env.local`**:
   ```env
   DATABASE_URL="postgresql://[URL_DA_VERCEL]"
   DIRECT_URL="postgresql://[URL_DA_VERCEL]"
   ```

3. **Aplicar migrations**:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

4. **Rodar seed** (se necessário):
   ```bash
   npm run seed
   ```

### Opção B: Zerar e Recriar (Se dados de produção não forem importantes)

1. **Resetar banco**:
   ```bash
   npx prisma migrate reset
   ```

2. **Aplicar migrations**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Rodar seed**:
   ```bash
   npm run seed
   ```

4. **Atualizar Vercel** com mesmo `DATABASE_URL`

---

## 🔐 Validações de Segurança

### 1. Certificado A1 Obrigatório

**ADMIN pode fazer writes APENAS com**:
- ✅ Certificado A1 válido no banco (`AdminCertificate`)
- ✅ Senha do certificado (via biometria MacBook)
- ✅ Write Guard passa (6 camadas)

**Validação**:
- Certificado deve estar em `secrets/certs/assinatura_a1.pfx`
- Senha em `CERT_A1_PASSWORD` no `.env.local`
- `CERT_A1_ENFORCE_WRITES=true`

### 2. Um Insert por Vez

**Garantido por**:
- ✅ `AdminSession` com `userId @unique` (um admin ativo por vez)
- ✅ Write Guard bloqueia se outra sessão ativa
- ✅ Certificado A1 valida identidade

---

## 📊 Estratégia de Backup e Sincronização

### 1. Backup Lógico (pg_dump)

**Script**: `scripts/backup/backup-logico.sh`

```bash
# Executar manualmente ou via cron
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Frequência recomendada**: Diária

### 2. Neon Point-in-Time Restore

**Disponível no Neon Dashboard**:
- Acesse: https://console.neon.tech
- Selecione projeto
- "Branches" → "Create Branch" (para backup)
- "Point-in-Time Restore" (para restaurar)

### 3. Sincronização Incremental

**Não necessária** - Banco único garante sincronização automática:
- ✅ Localhost e produção usam mesmo banco
- ✅ Mudanças são imediatas em ambos
- ✅ Sem necessidade de sync manual

---

## ✅ Checklist de Validação

- [ ] `DATABASE_URL` idêntico em localhost e Vercel
- [ ] `DIRECT_URL` idêntico em localhost e Vercel
- [ ] Migrations aplicadas (`npx prisma migrate deploy`)
- [ ] Prisma Client gerado (`npx prisma generate`)
- [ ] Seed executado (`npm run seed`)
- [ ] Certificado A1 configurado
- [ ] `CERT_A1_ENFORCE_WRITES=true`
- [ ] Teste: Criar galeria em localhost → aparece em produção
- [ ] Teste: Criar galeria em produção → aparece em localhost

---

## 🚨 Problemas Conhecidos

### 1. "Camada 3 falhou: Script pré-start não validado"

**Causa**: `AdminSession` não foi criada ou `preStartValidated=false`

**Solução**:
```bash
# Executar validação pré-start
npm run validate

# Ou rodar dev (que executa prestart.sh automaticamente)
npm run dev
```

### 2. CPF Duplicado

**Verificar**:
- Schema tem `cpf @unique` ✅
- Validação na API de criação ✅
- Validação na API de edição ✅

**Se ainda aparecer duplicado**:
- Verificar se é apenas máscara/formatação na interface
- Verificar dados reais no banco: `SELECT cpf FROM "User" WHERE cpf IS NOT NULL;`

---

## 📝 Relatório Técnico

### Mudanças Implementadas

1. **Logout Corrigido**
   - Usa mesma lógica de expiração de sessão
   - Mensagem por 2 segundos + redirecionamento
   - Limpeza completa de cookies e storage

2. **Tempo de Expiração**
   - ADMIN: 10 minutos ✅
   - SUPER_ADMIN: 10 minutos ✅
   - Outros: 5 minutos ✅

3. **Validação de Idade**
   - Campo data limitado a 18+ anos
   - Exibe idade atual abaixo do campo
   - Validação no backend

4. **CPF Único**
   - Schema: `cpf @unique` ✅
   - Validação na criação ✅
   - Validação na edição ✅

5. **Certificado A1**
   - Write Guard implementado ✅
   - Requer senha (biometria) ✅
   - Um insert por vez (AdminSession) ✅

6. **Banco Unificado**
   - Requer configuração manual
   - Verificar `DATABASE_URL` em ambos ambientes
   - Aplicar migrations

---

**Próximo Passo**: Validar `DATABASE_URL` em localhost e Vercel são idênticos

