# Resumo da Migração - Modo Laboratório → Modo Real

**Data**: 2025-01-20  
**Status**: ✅ Implementação Completa

---

## 📋 Arquivos Criados/Modificados

### Novos Arquivos

1. **`src/lib/certificate-a1-production.ts`**
   - Módulo de produção para Certificado A1
   - Valida e assina operações administrativas
   - Registra em AdminOperation

2. **`scripts/backup/backup-logico.sh`**
   - Script de backup lógico do banco
   - Calcula checksum SHA256
   - Limpeza automática (mantém últimos 10)

3. **`scripts/setup-local.sh`**
   - Script completo de instalação/atualização localhost
   - Valida pré-requisitos, .env.local, banco, seed, segurança

4. **`docs/NEON-BRANCHING-STRATEGY.md`**
   - Estratégia completa de Neon Branching
   - Fluxo de rollback
   - Backup lógico

5. **`.env.local.example`**
   - Template completo de variáveis de ambiente
   - Inclui CERT_A1_ENFORCE_WRITES

### Arquivos Modificados

1. **`src/lib/write-guard.ts`**
   - Integrado com `certificate-a1-production.ts`
   - Valida Certificado A1 a cada operação
   - Hard fail se certificado inválido

2. **`src/app/api/galleries/route.ts`**
   - POST integrado com guards de escrita
   - Requer Certificado A1 quando `CERT_A1_ENFORCE_WRITES=true`

3. **`src/app/api/admin/users/route.ts`**
   - POST integrado com guards de escrita
   - Requer Certificado A1 para criar usuários

4. **`prisma/seed.ts`**
   - Adicionado SUPER_ADMIN (super@tna.studio / Super@2025!)

---

## 🔧 Novas Variáveis de Ambiente

### Obrigatórias para Modo Real

```env
# Certificado A1 (OBRIGATÓRIO para escrita admin)
CERT_A1_FILE_PATH=./secrets/certs/assinatura_a1.pfx
CERT_A1_PASSWORD=***NAO_COMMITAR***
CERT_A1_OWNER_NAME="LUIS MAURICIO JUNQUEIRA ZANIN"

# Ativar enforcement (true = obrigatório)
CERT_A1_ENFORCE_WRITES=true

# Modo de teste (logs extras)
SECURITY_TEST_MODE=true
```

### Banco Unificado

```env
# Mesmo banco para localhost e produção
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
DIRECT_URL="postgresql://user:pass@host:port/db?sslmode=require"
```

---

## 🚀 Comandos para Executar

### 1. Setup Inicial (Primeira Vez)

```bash
# Copiar template de variáveis
cp .env.local.example .env.local

# Editar .env.local e preencher:
# - DATABASE_URL (banco Neon único)
# - DIRECT_URL (mesmo banco)
# - NEXTAUTH_SECRET (gerar com: openssl rand -base64 32)
# - CERT_A1_FILE_PATH (caminho do .pfx)
# - CERT_A1_PASSWORD (senha do certificado)
# - CERT_A1_ENFORCE_WRITES=true

# Executar setup completo
chmod +x scripts/setup-local.sh
./scripts/setup-local.sh
```

### 2. Aplicar Migrations e Seed

```bash
# Aplicar migrations
npx prisma migrate deploy

# Gerar Prisma Client
npx prisma generate

# Criar usuários de teste (inclui SUPER_ADMIN)
npm run seed
```

### 3. Iniciar Servidor

```bash
# Validação automática antes de iniciar
npm run dev
```

---

## 🧪 Passo a Passo para Testar

### Teste 1: Login como SUPER_ADMIN e ADMIN

1. **Acessar**: `http://localhost:3000/signin`

2. **Login SUPER_ADMIN**:
   - Email: `super@tna.studio`
   - Senha: `Super@2025!`
   - ✅ Deve fazer login com sucesso

3. **Logout e Login ADMIN**:
   - Email: `admin@tna.studio`
   - Senha: `Admin@2025!`
   - ✅ Deve fazer login com sucesso

### Teste 2: Criação de Galeria com A1 OK

1. **Login como ADMIN** (`admin@tna.studio`)

2. **Acessar**: `http://localhost:3000/galleries`

3. **Criar nova galeria**:
   - Título: "Teste Galeria"
   - Descrição: "Teste com Certificado A1"
   - ✅ Deve criar com sucesso (se certificado válido)

4. **Verificar AdminOperation**:
   ```bash
   npx prisma studio
   # Verificar tabela AdminOperation
   # Deve ter registro da operação com:
   # - operationType: "create_gallery"
   # - certificateSerial: serial do certificado
   # - signatureHash: hash da assinatura
   # - success: true
   ```

### Teste 3: Simulação de Falha (Certificado Inválido)

1. **Renomear certificado** (simular perda):
   ```bash
   mv secrets/certs/assinatura_a1.pfx secrets/certs/assinatura_a1.pfx.backup
   ```

2. **Tentar criar galeria**:
   - ✅ Deve retornar erro 403
   - ✅ Mensagem: "Certificado A1 inválido: Arquivo não encontrado"
   - ✅ Operação bloqueada registrada em AdminOperation

3. **Restaurar certificado**:
   ```bash
   mv secrets/certs/assinatura_a1.pfx.backup secrets/certs/assinatura_a1.pfx
   ```

4. **Tentar criar galeria novamente**:
   - ✅ Deve funcionar normalmente

### Teste 4: Simulação de Falha (Senha Errada)

1. **Alterar senha no .env.local**:
   ```env
   CERT_A1_PASSWORD="senha_errada"
   ```

2. **Reiniciar servidor**:
   ```bash
   # Parar (Ctrl+C)
   npm run dev
   ```

3. **Tentar criar galeria**:
   - ✅ Deve retornar erro 403
   - ✅ Mensagem: "Erro ao descriptografar certificado. Senha incorreta"

4. **Restaurar senha correta** e reiniciar

---

## 📊 Operações que Exigem Certificado A1

### Quando `CERT_A1_ENFORCE_WRITES=true`:

- ✅ **Criação/edição/exclusão de usuários** (especialmente dados sensíveis)
- ✅ **Criação/edição/exclusão de galerias**
- ✅ **Upload/alteração de termos de autorização**
- ✅ **Alteração de AppConfig** (configurações globais)
- ✅ **Operações de branching/rollback** (futuro)

### Operações que NÃO exigem A1:

- ❌ **Leitura** (listar galerias, visualizar dados)
- ❌ **Login** (autenticação)
- ❌ **Operações de usuários não-admin** (modelos, clientes)

---

## 🔐 SUPER_ADMIN vs ADMIN

### SUPER_ADMIN

**Pode:**
- ✅ Registrar/atualizar Certificado A1
- ✅ Criar/editar usuários ADMIN
- ✅ Gerenciar AppConfig
- ✅ Executar operações administrativas (com A1)

**NÃO pode:**
- ❌ Escrever diretamente sem Certificado A1 (mesmo que SUPER_ADMIN)

### ADMIN

**Pode:**
- ✅ Executar operações administrativas (com A1)
- ✅ Criar/editar galerias, termos, etc.

**NÃO pode:**
- ❌ Registrar/atualizar Certificado A1
- ❌ Criar/editar outros ADMIN
- ❌ Gerenciar AppConfig

---

## 📚 Documentação Atualizada

### Arquivos Atualizados

1. **`README.md`**
   - Seção "Instalação Rápida" com `setup-local.sh`
   - Banco unificado documentado
   - Certificado A1 obrigatório

2. **`ARQUITETURA.md`**
   - Seção "Banco de Dados Unificado"
   - Seção "Neon Branching e Rollback"
   - SUPER_ADMIN documentado

3. **`SEGURANCA.md`**
   - Certificado A1 como camada jurídico-técnica
   - Justificativas legais (Lei 14.063/2020, ICP-Brasil)
   - Estratégia de rollback e backup

4. **`docs/NEON-BRANCHING-STRATEGY.md`** (NOVO)
   - Estratégia completa de branching
   - Fluxo de rollback
   - Backup lógico

---

## 🚨 Riscos Identificados e Mitigações

### 1. Certificado Expirado

**Risco**: Certificado expira, operações bloqueadas

**Mitigação**:
- ✅ Validação de datas antes de cada operação
- ✅ Alertas na página de teste
- ✅ Processo de renovação documentado

### 2. Perda de Certificado

**Risco**: Arquivo .pfx perdido/corrompido

**Mitigação**:
- ✅ Backup do certificado em local seguro
- ✅ SUPER_ADMIN pode re-registrar certificado
- ✅ Operações bloqueadas até certificado válido

### 3. Concorrência (Dois Admins Simultâneos)

**Risco**: Dois admins tentando operar ao mesmo tempo

**Mitigação**:
- ✅ AdminSession rastreia ambiente
- ✅ Bloqueio se ativo em outro ambiente
- ✅ Auditoria completa em AdminOperation

### 4. Migration Aplicada pela Metade

**Risco**: Migration falha no meio, banco inconsistente

**Mitigação**:
- ✅ Neon Branching para testar migrations
- ✅ Point-in-Time Restore disponível
- ✅ Backup lógico como último recurso

### 5. Vazamento do Certificado

**Risco**: Arquivo .pfx vazado

**Mitigação**:
- ✅ Certificado nunca commitado (`.gitignore`)
- ✅ Senha via variável de ambiente
- ✅ Rotação de certificado (processo documentado)

---

## ✅ Checklist Final

### Implementação

- [x] Banco unificado (Neon único)
- [x] Certificado A1 obrigatório (`CERT_A1_ENFORCE_WRITES=true`)
- [x] Guards integrados em APIs de escrita
- [x] SUPER_ADMIN implementado
- [x] Seed atualizado com SUPER_ADMIN
- [x] Script de setup local criado
- [x] Script de backup lógico criado
- [x] Estratégia Neon Branching documentada
- [x] Documentação atualizada

### Testes

- [ ] Login SUPER_ADMIN funciona
- [ ] Login ADMIN funciona
- [ ] Criação de galeria com A1 OK funciona
- [ ] Criação de galeria sem A1 é bloqueada
- [ ] AdminOperation registra operações
- [ ] Backup lógico funciona
- [ ] Setup local funciona do zero

---

## 🎯 Próximos Passos

1. **Testar todos os cenários** acima
2. **Validar AdminOperation** registrando corretamente
3. **Criar UI para SUPER_ADMIN** gerenciar certificado (futuro)
4. **Implementar operações de branching** via API (futuro)

---

**Status**: ✅ Migração Completa - Pronto para Testes  
**Próximo**: Validar funcionamento completo e ajustar se necessário

