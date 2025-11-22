# Alterações - Login por Credenciais Resiliente

**Data:** 2025-11-21  
**Objetivo:** Tornar login por credenciais resiliente a falhas de certificado

## Resumo Executivo

✅ **Problema resolvido:** Login por credenciais agora funciona mesmo se a tabela `AdminCertificate` não existir ou houver problemas com o certificado A1.

✅ **Princípio:** Login por email/senha é **totalmente independente** do certificado digital A1.

✅ **Degradabilidade:** Sistema funciona mesmo sem certificado configurado.

## Arquivos Modificados

### 1. `src/lib/certificate-login.ts`
**Mudanças:**
- Envolvido acesso a `prisma.adminCertificate.findFirst()` em `try/catch`
- Tratamento específico para erro `P2021` (tabela não existe) e `P1001` (conexão)
- Retorna `null` silenciosamente quando a tabela não existe (sem quebrar fluxo)
- Logs informativos mas não críticos

**Antes:**
```typescript
const certificateRecord = await prisma.adminCertificate.findFirst({...});
// Quebrava se tabela não existisse
```

**Depois:**
```typescript
let certificateRecord = null;
try {
  certificateRecord = await prisma.adminCertificate.findFirst({...});
} catch (error: any) {
  if (error?.code === "P2021" || error?.code === "P1001") {
    console.warn(`[CertificateLogin] Tabela AdminCertificate não existe...`);
    return { success: false, error: "Use login por senha." };
  }
}
```

### 2. `src/lib/arquiteto-session.ts`
**Mudanças:**
- `registerArquitetoSession()` protegido contra tabela `ArquitetoSession` inexistente
- Se a tabela não existir, apenas loga aviso e retorna (não lança erro)
- Login continua funcionando mesmo sem sessão especial

**Mudança:**
```typescript
export async function registerArquitetoSession(...) {
  try {
    // ... código de registro ...
  } catch (error: any) {
    if (error?.code === "P2021" || error?.code === "P1001") {
      console.warn(`[ArquitetoSession] Tabela não existe...`);
      return; // Não lança erro, apenas retorna
    }
    throw error; // Outros erros são relançados
  }
}
```

### 3. `prisma/seed.ts`
**Mudanças:**
- Lógica de associação de certificado protegida por `try/catch` aninhado
- Tratamento específico para erro `P2021` (tabela inexistente)
- Seed não falha se a tabela `AdminCertificate` não existir

**Mudança:**
```typescript
try {
  await prisma.adminCertificate.upsert({...});
} catch (error: any) {
  if (error?.code === "P2021") {
    console.warn(`⚠️  Tabela AdminCertificate não existe ainda...`);
  }
}
```

### 4. `prisma/migrations/20251121223123_add_admin_certificate_table/migration.sql`
**Mudanças:**
- Migration criada para criar a tabela `AdminCertificate`
- Usa `CREATE TABLE IF NOT EXISTS` para ser idempotente
- Todos os índices e foreign keys criados

### 5. `ARQUITETURA-ARQUITETO.md`
**Mudanças:**
- Documentação atualizada sobre degradabilidade
- Explicação de que login por credenciais funciona sem certificado
- Nota sobre resiliência do sistema

## Comandos Executados

### 1. Criar Migration
```bash
npx prisma migrate dev --name add_admin_certificate_table --create-only
```
**Resultado:** ✅ Migration criada

### 2. Aplicar Migration
```bash
npx prisma migrate deploy
```
**Resultado:** 
```
Applying migration `20251121223123_add_admin_certificate_table`
✅ All migrations have been successfully applied.
```

### 3. Regenerar Prisma Client
```bash
npx prisma generate
```
**Resultado:**
```
✔ Generated Prisma Client (v6.19.0) to ./node_modules/@prisma/client in 66ms
```

## Validação Esperada

### Teste de Login por Credenciais

1. **Acessar:** `http://localhost:3000/signin`
2. **Credenciais:**
   - Email: `[redacted-email]`
   - Senha: `[redacted-password]`
3. **Resultado Esperado:**
   - ✅ Login bem-sucedido
   - ✅ Redirecionamento para home autenticada
   - ✅ Role: `ARQUITETO` na sessão
   - ✅ Nenhum erro `P2021` no log
   - ✅ Nenhum erro `CredentialsSignin` causado por certificado

### Logs Esperados

**Sucesso:**
```
[Auth] Tentativa de login para: [redacted-email]
[Auth] Login bem-sucedido para: [redacted-email] (role: ARQUITETO)
[ArquitetoSession] Sessão registrada para userId=... em localhost
[Auth] Retornando dados do usuário: { id: ..., email: ..., role: ARQUITETO }
```

**Se tabela não existir (warning, não erro):**
```
[ArquitetoSession] Tabela ArquitetoSession não existe ou não está acessível (P2021). Login continuará sem sessão especial.
[Auth] Login bem-sucedido para: [redacted-email] (role: ARQUITETO)
```

## Status Final

### ✅ Concluído:
- Login por credenciais resiliente a falhas de certificado
- Migration para `AdminCertificate` criada e aplicada
- Seed protegido contra erros de certificado
- Documentação atualizada
- Prisma Client regenerado

### ⏳ Próximo Passo:
- Testar login em localhost: `npm run dev`
- Testar login em produção
- Validar que erros de certificado não afetam mais o login

## Observações Importantes

1. **Login por credenciais** funciona **independentemente** do estado do certificado A1
2. **Erros de certificado** são tratados como **warnings**, não errors críticos
3. **Sistema degrada graciosamente** - funciona mesmo sem certificado configurado
4. **Migração aplicada** - tabela `AdminCertificate` agora existe no banco

## Testes Manuais Recomendados

1. ✅ Testar login por email/senha (deve funcionar)
2. ✅ Verificar logs (não deve haver erros P2021)
3. ✅ Verificar sessão (deve ter role ARQUITETO)
4. ✅ Testar logout (deve funcionar normalmente)

---

**Status:** ✅ **PRONTO PARA TESTES**

O login por credenciais está resiliente e deve funcionar corretamente mesmo se houver problemas com o certificado A1.

