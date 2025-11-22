# Estratégia de Neon Branching e Rollback

## 🎯 Visão Geral

O TNA Studio usa **um único banco Neon** compartilhado entre localhost e produção, com estratégia de **branching** para isolamento e **rollback rápido** em caso de problemas.

## 📊 Arquitetura de Banco

### Banco Único

- **Um único banco Neon** usado por localhost e produção
- **DATABASE_URL** e **DIRECT_URL** apontam para o mesmo banco
- Integridade garantida por:
  - Script pré-start
  - Version-guards
  - AdminSession
  - Certificado A1 obrigatório para escrita

### Branches Neon

**Branch Principal (prod/main):**
- Usado por produção (Vercel) e localhost em modo normal
- Contém dados reais
- Migrations aplicadas apenas após validação

**Branch de Trabalho (dev-local / feature-*):**
- Usado para experimentos arriscados
- Migrations grandes ou features sem validação
- Pode ser descartado ou promovido

## 🔄 Fluxo de Trabalho

### Desenvolvimento Normal

1. **Localhost e Vercel** apontam para branch principal
2. **Migrations pequenas** podem ser aplicadas diretamente
3. **Script pré-start** valida antes de permitir escrita

### Desenvolvimento Arriscado

1. **Criar branch temporário** antes de migrations grandes:
   ```bash
   # Via Neon Console ou CLI
   neon branches create feature-migration-20250120
   ```

2. **Atualizar DATABASE_URL** para apontar ao branch:
   ```env
   DATABASE_URL="postgresql://user:pass@feature-migration-20250120.ep-xxx.neon.tech/db"
   ```

3. **Aplicar migrations** no branch:
   ```bash
   npx prisma migrate dev
   ```

4. **Validar** (smoke tests, validações manuais)

5. **Promover ou descartar:**
   - Se OK: Promover branch como principal (via Neon Console)
   - Se falhou: Descartar branch e voltar ao principal

## 🔙 Rollback Rápido

### Cenário 1: Deploy quebrou produção

1. **Identificar branch anterior** (ex: `prod-20250119`)
2. **Atualizar DATABASE_URL na Vercel** para apontar ao branch anterior
3. **Redeploy** (ou apenas atualizar variável de ambiente)
4. **Sistema volta ao estado anterior**

### Cenário 2: Migration aplicada pela metade

1. **Usar Point-in-Time Restore** (se disponível no plano Neon)
2. **Restaurar até momento antes da migration**
3. **Corrigir migration e reaplicar**

### Cenário 3: Erro humano grave

1. **Usar backup lógico** (`scripts/backup/backup-logico.sh`)
2. **Restaurar dump** em branch novo
3. **Validar dados**
4. **Promover branch como principal**

## 📦 Backup Lógico

### Script de Backup

```bash
# Executar backup manual
./scripts/backup/backup-logico.sh
```

**O que faz:**
- Dump completo do banco via `pg_dump`
- Calcula checksum SHA256
- Armazena em `./backups/` com timestamp
- Mantém últimos 10 backups (limpeza automática)

### Armazenamento

**Recomendações:**
- ✅ Armazenar em local seguro (pasta local protegida)
- ✅ Enviar para Sync.com ou outro cofre
- ✅ NUNCA commitar no Git
- ✅ Rotular com data/hora e hash de integridade
- ✅ Manter por pelo menos 6 meses (conforme GDPR)

### Restauração

```bash
# Restaurar backup
psql $DATABASE_URL < backups/tna-studio-backup-20250120_120000.sql
```

## 🔐 Segurança e Auditoria

### Operações Restritas

Todas as operações de branching/rollback são:
- ✅ **Restritas ao SUPER_ADMIN**
- ✅ **Assinadas com Certificado A1**
- ✅ **Registradas em AdminOperation**

### Tipos de Operação Auditados

- `switch_database_branch` - Troca de branch
- `rollback_point_in_time` - Rollback temporal
- `apply_dump_restore` - Restauração de backup
- `promote_branch` - Promoção de branch

### Exemplo de Auditoria

```typescript
// Operação de troca de branch
await logAdminOperation(
  superAdminId,
  "switch_database_branch",
  null,
  JSON.stringify({ from: "main", to: "feature-xxx" }),
  certificateSerial,
  signatureHash,
  signatureData,
  ip,
  userAgent,
  true
);
```

## 📋 Checklist de Operações

### Antes de Migration Grande

- [ ] Criar branch temporário no Neon
- [ ] Atualizar DATABASE_URL para branch temporário
- [ ] Aplicar migrations no branch
- [ ] Validar (smoke tests)
- [ ] Se OK: Promover branch
- [ ] Se falhou: Descartar branch

### Em Caso de Rollback

- [ ] Identificar branch/timestamp anterior
- [ ] Atualizar DATABASE_URL
- [ ] Validar acesso ao banco
- [ ] Registrar operação em AdminOperation (SUPER_ADMIN + A1)
- [ ] Monitorar logs

### Backup Periódico

- [ ] Executar `./scripts/backup/backup-logico.sh` semanalmente
- [ ] Verificar checksum do backup
- [ ] Enviar para local seguro
- [ ] Documentar localização

## 🚨 Riscos e Mitigações

### Risco: Escrita em Branch Errado

**Mitigação:**
- Script pré-start valida DATABASE_URL
- AdminSession rastreia ambiente
- Logs de todas operações administrativas

### Risco: Migration Aplicada pela Metade

**Mitigação:**
- Usar transações quando possível
- Point-in-Time Restore disponível
- Backup lógico como último recurso

### Risco: Perda de Dados

**Mitigação:**
- Backups lógicos periódicos
- Neon mantém histórico de branches
- Auditoria completa de operações

## 📚 Referências

- **Neon Branching**: https://neon.tech/docs/branching
- **Point-in-Time Restore**: https://neon.tech/docs/point-in-time-restore
- **Backup e Restore**: https://neon.tech/docs/backup-restore

---

**Última atualização**: 2025-01-20  
**Status**: Estratégia documentada e implementada

