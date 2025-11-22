# Proposta de Schema - Segurança e Versionamento

## 📋 Mudanças Propostas no Schema

### 1. Nova Tabela: `AppConfig`

```prisma
model AppConfig {
  id                        String   @id @default("singleton") // Sempre um único registro
  authorizedCodeVersion     String?  // Git commit SHA autorizado para escrita
  authorizedMigrationVersion String? // Última migration autorizada
  productionWriteEnabled    Boolean  @default(true) // Flag de emergência (pode desabilitar produção)
  updatedAt                 DateTime @updatedAt
  updatedBy                 String?  // userId que fez última atualização
  
  // Sem relações - tabela singleton
}
```

**Uso:**
- Rastreia versões "oficiais" autorizadas
- Atualizado manualmente após deploy bem-sucedido
- Ou automaticamente na primeira execução

---

### 2. Expansão: `AdminSession`

**Campos Adicionais:**
```prisma
model AdminSession {
  id              String   @id @default(cuid())
  userId          String   @unique
  environment     String   // "localhost" | "production"
  ip              String
  userAgent       String
  codeVersion     String   // Git commit SHA da instância atual
  migrationVersion String  // Última migration aplicada no banco
  writeEnabled    Boolean  @default(false) // Só true se versões OK
  lastValidatedAt DateTime? // Timestamp da última validação
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([environment])
  @@index([expiresAt])
  @@index([writeEnabled]) // Para queries rápidas
}
```

**Campos Novos:**
- `codeVersion` - Commit SHA do código rodando
- `migrationVersion` - Última migration aplicada
- `writeEnabled` - Flag que indica se pode escrever
- `lastValidatedAt` - Quando foi validado pela última vez

---

## 🔄 Migration SQL Proposta

```sql
-- Criar tabela AppConfig
CREATE TABLE "AppConfig" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "authorizedCodeVersion" TEXT,
  "authorizedMigrationVersion" TEXT,
  "productionWriteEnabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT
);

-- Inserir registro inicial
INSERT INTO "AppConfig" ("id", "productionWriteEnabled", "updatedAt")
VALUES ('singleton', true, NOW());

-- Expandir AdminSession
ALTER TABLE "AdminSession" 
ADD COLUMN "codeVersion" TEXT,
ADD COLUMN "migrationVersion" TEXT,
ADD COLUMN "writeEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastValidatedAt" TIMESTAMP(3);

-- Criar índices
CREATE INDEX "AdminSession_writeEnabled_idx" ON "AdminSession"("writeEnabled");
```

---

## ✅ Validação Pré-Migration

Antes de aplicar, verificar:

- [ ] Schema atual está em produção?
- [ ] Todas as migrations anteriores aplicadas?
- [ ] Backup do banco criado?
- [ ] Código local sincronizado com produção?

---

**Status**: Proposta para revisão  
**Próximo**: Aprovar antes de criar migration

