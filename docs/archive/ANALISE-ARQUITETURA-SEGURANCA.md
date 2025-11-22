# Análise de Arquitetura e Segurança - TNA Studio

**Consultoria Sênior - Revisão Arquitetural**  
**Data**: 2025-01-20  
**Contexto**: Base compartilhada entre localhost e produção

---

## 🔴 ANÁLISE DE RISCOS ATUAIS

### 1. **Risco CRÍTICO: Migrations Divergentes**

**Problema:**
- Localhost pode ter migrations não aplicadas em produção
- Localhost pode ter migrations aplicadas que produção não tem
- Código localhost pode tentar usar campos/tabelas que não existem em produção
- Código produção pode tentar usar campos/tabelas que localhost criou mas não foram aplicadas

**Impacto:**
- **Corrupção de dados**: Queries podem falhar silenciosamente ou retornar dados inconsistentes
- **Perda de dados**: Migrations aplicadas em localhost podem alterar estrutura que produção ainda não suporta
- **Downtime**: Produção pode quebrar se localhost aplicar migration destrutiva

**Severidade**: 🔴 **CRÍTICA**

---

### 2. **Risco ALTO: AdminSession Insuficiente**

**Problema Atual:**
- `AdminSession` só rastreia `environment` e `expiresAt`
- Não valida versão de código
- Não valida versão de migrations
- Não diferencia operações read vs write
- Não tem mecanismo de destravamento de emergência

**Impacto:**
- Admin pode operar com código desatualizado em produção
- Admin pode aplicar migrations erradas
- Não há proteção contra operações destrutivas de localhost

**Severidade**: 🟠 **ALTA**

---

### 3. **Risco MÉDIO: Falta de Modo Read-Only**

**Problema:**
- Localhost conectado à produção pode fazer qualquer operação
- Não há distinção entre leitura e escrita por ambiente
- Bugs em localhost podem corromper dados de produção

**Impacto:**
- Operações acidentais de DELETE/UPDATE em produção
- Criação de dados de teste misturados com produção

**Severidade**: 🟡 **MÉDIA**

---

### 4. **Risco BAIXO: CPF Único (Bem Implementado)**

**Status:**
- ✅ Constraint `@unique` no banco (proteção a nível DB)
- ✅ Validação em código antes de criar usuário
- ✅ `ownerCpf` preservado mesmo se usuário deletado

**Melhorias Sugeridas:**
- Adicionar validação de CPF antes de todas as operações de escrita
- Adicionar índice composto para queries de acesso por CPF

**Severidade**: 🟢 **BAIXA** (já bem protegido)

---

## 📊 AVALIAÇÃO DAS PROPOSTAS

### (A) Modo DEV Seguro (Read-Only) ✅ **RECOMENDADO**

**Análise:**
- ✅ **Excelente ideia** - Reduz drasticamente risco de corrupção
- ✅ **Implementação viável** - Pode ser feito em múltiplas camadas
- ⚠️ **Cuidado**: Não pode ser apenas no código (fácil de burlar)

**Recomendação:**
- **Implementar em 3 camadas**:
  1. **Variável de ambiente** (`APP_MODE=read_only`) - Controle explícito
  2. **Middleware Prisma** - Intercepta operações destrutivas
  3. **Validação em APIs** - Última linha de defesa

**Onde aplicar:**
- ✅ **Camada de Service** (recomendado) - Abstração sobre Prisma
- ✅ **Policies no banco** (PostgreSQL Row Level Security) - Mais seguro, mas complexo
- ⚠️ **Apenas em APIs** - Menos seguro, mas mais simples

**Implementação Sugerida:**
```typescript
// src/lib/prisma-guard.ts
export function canWrite(environment: string, mode: string): boolean {
  if (mode === "read_only") return false;
  if (environment === "localhost" && process.env.DATABASE_URL === process.env.PRODUCTION_DATABASE_URL) {
    return false; // Localhost conectado à produção = read-only
  }
  return true;
}
```

---

### (B) AdminSession Sênior ✅ **ESSENCIAL**

**Análise:**
- ✅ **Crítico implementar** - Base para todas as outras proteções
- ✅ **Campos propostos são corretos** - Versão de código e migrations são essenciais
- ⚠️ **Complexidade**: Precisa de mecanismo de versionamento

**Problemas Identificados:**
1. **Como obter `codeVersion`?**
   - Solução: Variável de ambiente `GIT_COMMIT_SHA` (Vercel fornece automaticamente)
   - Localhost: Script que lê `git rev-parse HEAD` e injeta no `.env.local`

2. **Como obter `migrationVersion`?**
   - Solução: Tabela `_prisma_migrations` do Prisma já existe
   - Ler última migration aplicada: `SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1`

3. **DeviceId - Necessário?**
   - ⚠️ **Não recomendado** - Adiciona complexidade sem benefício real
   - Se é uma única máquina, `environment` + `ip` já identifica

**Proposta Melhorada:**
```prisma
model AdminSession {
  id              String   @id @default(cuid())
  userId          String   @unique
  environment     String   // "localhost" | "production"
  ip              String
  userAgent       String
  codeVersion     String   // Git commit SHA
  migrationVersion String  // Última migration aplicada
  writeEnabled    Boolean  @default(false) // Precisa validação para habilitar
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([environment])
  @@index([expiresAt])
}
```

**Fluxo:**
1. Login admin → Cria `AdminSession` com `writeEnabled: false`
2. Valida versões → Se OK, `writeEnabled: true`
3. Operações admin → Verificam `writeEnabled` antes de executar
4. Logout → Remove sessão

---

### (C) Garantia de Versão ✅ **CRÍTICO**

**Análise:**
- ✅ **Absolutamente essencial** - Sem isso, risco de corrupção é alto
- ✅ **Implementação viável** - Prisma já rastreia migrations
- ⚠️ **Complexidade**: Precisa sincronizar versões entre ambientes

**Problemas e Soluções:**

**1. Onde guardar versão autorizada?**
- ✅ **Tabela `AppConfig`** (recomendado)
  ```prisma
  model AppConfig {
    id                String   @id @default("singleton")
    authorizedCodeVersion String?  // Commit SHA autorizado
    authorizedMigrationVersion String? // Migration autorizada
    updatedAt         DateTime @updatedAt
  }
  ```
- ⚠️ **AdminSession** - Não recomendado (múltiplas sessões = múltiplas versões)

**2. Como inferir codeVersion?**
- **Vercel**: `process.env.VERCEL_GIT_COMMIT_SHA` (automático)
- **Localhost**: Script que lê git e injeta em `.env.local`
  ```bash
  # scripts/set-version.sh
  echo "GIT_COMMIT_SHA=$(git rev-parse HEAD)" >> .env.local
  ```

**3. Como inferir migrationVersion?**
- **Prisma**: Consultar `_prisma_migrations`
  ```typescript
  const lastMigration = await prisma.$queryRaw`
    SELECT migration_name 
    FROM _prisma_migrations 
    WHERE finished_at IS NOT NULL 
    ORDER BY finished_at DESC 
    LIMIT 1
  `;
  ```

**Implementação:**
```typescript
// src/lib/version-guard.ts
export async function validateVersions(): Promise<{
  valid: boolean;
  codeVersionMatch: boolean;
  migrationVersionMatch: boolean;
  errors: string[];
}> {
  const currentCodeVersion = process.env.GIT_COMMIT_SHA || "unknown";
  const currentMigrationVersion = await getCurrentMigrationVersion();
  
  const config = await prisma.appConfig.findUnique({
    where: { id: "singleton" },
  });
  
  const errors: string[] = [];
  
  if (!config) {
    // Primeira execução - permite e cria config
    await prisma.appConfig.create({
      data: {
        id: "singleton",
        authorizedCodeVersion: currentCodeVersion,
        authorizedMigrationVersion: currentMigrationVersion,
      },
    });
    return { valid: true, codeVersionMatch: true, migrationVersionMatch: true, errors: [] };
  }
  
  const codeVersionMatch = config.authorizedCodeVersion === currentCodeVersion;
  const migrationVersionMatch = config.authorizedMigrationVersion === currentMigrationVersion;
  
  if (!codeVersionMatch) {
    errors.push(`Code version mismatch: expected ${config.authorizedCodeVersion}, got ${currentCodeVersion}`);
  }
  
  if (!migrationVersionMatch) {
    errors.push(`Migration version mismatch: expected ${config.authorizedMigrationVersion}, got ${currentMigrationVersion}`);
  }
  
  return {
    valid: codeVersionMatch && migrationVersionMatch,
    codeVersionMatch,
    migrationVersionMatch,
    errors,
  };
}
```

---

### (D) Separar Papéis ADMIN ✅ **ÚTIL, MAS NÃO ESSENCIAL**

**Análise:**
- ✅ **Útil para organização** - Mas não resolve problema de corrupção
- ⚠️ **Complexidade adicional** - Pode confundir mais que ajudar
- ✅ **Alternativa melhor**: Usar `AdminSession.writeEnabled` + validação de versão

**Recomendação:**
- ❌ **Não implementar roles separadas** - Adiciona complexidade sem resolver problema raiz
- ✅ **Usar `writeEnabled` flag** - Mais simples e efetivo
- ✅ **Modo read-only por ambiente** - Resolve o problema real

---

## 🏗️ PROPOSTA ARQUITETURAL CONSOLIDADA

### Camada 1: Versionamento e Configuração

**Schema:**
```prisma
model AppConfig {
  id                        String   @id @default("singleton")
  authorizedCodeVersion     String?  // Git commit SHA autorizado
  authorizedMigrationVersion String? // Última migration autorizada
  productionWriteEnabled    Boolean  @default(true) // Flag de emergência
  updatedAt                 DateTime @updatedAt
  updatedBy                 String?  // userId que atualizou
}

model AdminSession {
  id              String   @id @default(cuid())
  userId          String   @unique
  environment     String   // "localhost" | "production"
  ip              String
  userAgent       String
  codeVersion     String   // Git commit SHA atual
  migrationVersion String  // Última migration aplicada
  writeEnabled    Boolean  @default(false) // Só true se versões OK
  lastValidatedAt DateTime? // Última validação de versão
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([environment])
  @@index([expiresAt])
}
```

### Camada 2: Guards de Escrita

**Arquivo: `src/lib/write-guard.ts`**
```typescript
/**
 * Guards de escrita - Previne operações destrutivas em produção
 */

export async function canWrite(
  userId: string,
  userRole: Role,
  environment: string
): Promise<{ allowed: boolean; reason?: string }> {
  // 1. Verifica modo read-only
  if (process.env.APP_MODE === "read_only") {
    return { allowed: false, reason: "Sistema em modo read-only" };
  }
  
  // 2. Se não é admin, permite (usuários comuns não são problema)
  if (userRole !== Role.ADMIN) {
    return { allowed: true };
  }
  
  // 3. Verifica sessão de admin
  const session = await prisma.adminSession.findUnique({
    where: { userId },
  });
  
  if (!session) {
    return { allowed: false, reason: "Sessão de admin não encontrada" };
  }
  
  // 4. Verifica se write está habilitado
  if (!session.writeEnabled) {
    return {
      allowed: false,
      reason: "Escrita desabilitada. Versões de código/migrations não correspondem.",
    };
  }
  
  // 5. Verifica ambiente
  if (environment === "localhost" && session.environment !== "localhost") {
    return {
      allowed: false,
      reason: "Admin ativo em outro ambiente. Faça logout primeiro.",
    };
  }
  
  return { allowed: true };
}
```

### Camada 3: Prisma Middleware (Proteção a Nível ORM)

**Arquivo: `src/lib/prisma.ts` (expandir)**
```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Middleware que intercepta operações destrutivas
prisma.$use(async (params, next) => {
  // Operações que devem ser bloqueadas em read-only
  const destructiveOps = ["delete", "deleteMany", "update", "updateMany"];
  const isDestructive = destructiveOps.includes(params.action);
  
  if (isDestructive && process.env.APP_MODE === "read_only") {
    throw new Error("Operação bloqueada: sistema em modo read-only");
  }
  
  // Para admins, valida versões antes de operações críticas
  if (isDestructive && params.model === "User" || params.model === "Gallery") {
    // Validação adicional pode ser adicionada aqui
  }
  
  return next(params);
});

export { prisma };
```

### Camada 4: Validação em APIs

**Padrão para todas as APIs admin:**
```typescript
// src/app/api/admin/*/route.ts
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  
  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;
  
  // Valida permissão de escrita
  const writeCheck = await canWrite(userId, userRole, process.env.NODE_ENV);
  if (!writeCheck.allowed) {
    return NextResponse.json(
      { error: writeCheck.reason },
      { status: 403 }
    );
  }
  
  // Continua com operação...
}
```

---

## 📋 PLANO DE IMPLEMENTAÇÃO FASADO

### Fase 1: Fundação (Sem Risco) ✅

**Objetivo**: Criar estrutura base sem alterar comportamento atual

1. ✅ Criar migration para `AppConfig` e `AdminSession` expandido
2. ✅ Criar `src/lib/version-guard.ts` (validação de versões)
3. ✅ Criar `src/lib/write-guard.ts` (guards de escrita)
4. ✅ Adicionar variável `GIT_COMMIT_SHA` em produção (Vercel já fornece)
5. ✅ Script para localhost: `scripts/set-version.sh`

**Validação:**
- Migration aplicada sem erro
- `AppConfig` criado automaticamente na primeira execução
- Versões sendo rastreadas corretamente

---

### Fase 2: Integração (Baixo Risco) ⚠️

**Objetivo**: Integrar validações sem bloquear operações ainda

1. ⚠️ Atualizar `src/auth.ts` para incluir versões no `AdminSession`
2. ⚠️ Atualizar `src/lib/admin-session.ts` para validar versões
3. ⚠️ Adicionar logs de validação (não bloquear ainda)

**Validação:**
- Logs mostram validações sendo executadas
- Sessões sendo criadas com versões
- Nenhuma operação bloqueada ainda

---

### Fase 3: Ativação Gradual (Médio Risco) 🔶

**Objetivo**: Ativar proteções gradualmente

1. 🔶 Ativar validação de versão em `AdminSession` (bloquear se divergente)
2. 🔶 Adicionar `writeEnabled` check em UMA API admin (teste)
3. 🔶 Monitorar logs e erros
4. 🔶 Expandir para outras APIs gradualmente

**Validação:**
- Uma API protegida funcionando
- Logs mostrando bloqueios quando apropriado
- Nenhum falso positivo

---

### Fase 4: Proteção Completa (Alto Risco) 🔴

**Objetivo**: Ativar todas as proteções

1. 🔴 Ativar `writeEnabled` em TODAS as APIs admin
2. 🔴 Ativar modo read-only para localhost (quando conectado à produção)
3. 🔴 Adicionar Prisma middleware (opcional, mas recomendado)
4. 🔴 Criar rota de emergência para destravamento

**Validação:**
- Todas as APIs protegidas
- Localhost em read-only quando apropriado
- Rota de emergência testada

---

## 🚨 CHECKLISTS DE SEGURANÇA

### Checklist: Antes de Conectar Localhost à Produção

- [ ] **Versões sincronizadas**:
  - [ ] Código localhost no mesmo commit da produção
  - [ ] Migrations aplicadas em produção antes de conectar localhost
  - [ ] `GIT_COMMIT_SHA` configurado em `.env.local`

- [ ] **Modo read-only ativado**:
  - [ ] `APP_MODE=read_only` em `.env.local` quando conectado à produção
  - [ ] Ou usar `DATABASE_URL` diferente (recomendado)

- [ ] **AdminSession limpo**:
  - [ ] Nenhuma sessão admin ativa em produção
  - [ ] Ou fazer logout explícito antes de conectar

- [ ] **Backup do banco**:
  - [ ] Backup recente antes de qualquer operação

---

### Checklist: Antes de Deploy em Produção

- [ ] **Migrations testadas**:
  - [ ] Migrations aplicadas e testadas em ambiente de staging/localhost
  - [ ] Nenhuma migration destrutiva sem backup
  - [ ] Rollback plan testado

- [ ] **Versões validadas**:
  - [ ] `GIT_COMMIT_SHA` será o mesmo após deploy
  - [ ] `authorizedCodeVersion` atualizado após deploy bem-sucedido
  - [ ] `authorizedMigrationVersion` atualizado após migrations aplicadas

- [ ] **AdminSession**:
  - [ ] Todas as sessões admin expiradas ou removidas
  - [ ] Novo login após deploy criará sessão com versões corretas

- [ ] **Monitoramento**:
  - [ ] Logs de erro configurados
  - [ ] Alertas para operações bloqueadas

---

## 🔧 IMPLEMENTAÇÃO CONCRETA - ARQUIVOS A MODIFICAR

### 1. Schema Prisma (`prisma/schema.prisma`)

**Adicionar:**
```prisma
model AppConfig {
  id                        String   @id @default("singleton")
  authorizedCodeVersion     String?
  authorizedMigrationVersion String?
  productionWriteEnabled    Boolean  @default(true)
  updatedAt                 DateTime @updatedAt
  updatedBy                 String?
}

// Expandir AdminSession (já existe, adicionar campos)
```

### 2. Novos Arquivos

- `src/lib/version-guard.ts` - Validação de versões
- `src/lib/write-guard.ts` - Guards de escrita
- `src/lib/prisma-guard.ts` - Prisma middleware (opcional)
- `scripts/set-version.sh` - Script para localhost

### 3. Arquivos a Modificar

- `src/auth.ts` - Incluir versões no AdminSession
- `src/lib/admin-session.ts` - Validar versões e writeEnabled
- `src/lib/prisma.ts` - Adicionar middleware (opcional)
- `src/app/api/admin/**/*.ts` - Adicionar `canWrite()` check
- `src/app/api/galleries/route.ts` - Adicionar validação de CPF único

---

## 🎯 RECOMENDAÇÕES FINAIS

### ✅ MANTER

1. **CPF único** - Já bem implementado, manter
2. **Isolamento por CPF** - Funciona, manter
3. **AdminSession básico** - Expandir, não descartar

### ⚠️ AJUSTAR

1. **AdminSession** - Adicionar versionamento (crítico)
2. **Validação de versões** - Implementar (crítico)
3. **Modo read-only** - Implementar (alto valor)

### ❌ DESCARTAR

1. **Roles separadas (admin_production/admin_dev)** - Complexidade desnecessária
2. **DeviceId** - Não adiciona valor real

### 🆕 ADICIONAR

1. **AppConfig** - Tabela de configuração centralizada
2. **Version guards** - Validação de código e migrations
3. **Write guards** - Proteção de operações destrutivas
4. **Rota de emergência** - Destravamento manual quando necessário

---

## 📊 PRIORIZAÇÃO

**Crítico (Fazer Primeiro):**
1. ✅ Migration para `AppConfig` e `AdminSession` expandido
2. ✅ `version-guard.ts` e `write-guard.ts`
3. ✅ Integração em `auth.ts` e `admin-session.ts`

**Alto (Fazer Depois):**
4. ⚠️ Modo read-only para localhost
5. ⚠️ Validação em APIs admin

**Médio (Opcional):**
6. 🔶 Prisma middleware
7. 🔶 Rota de emergência

---

**Status**: Análise completa, pronto para implementação faseada  
**Próximo passo**: Aprovar proposta e iniciar Fase 1

