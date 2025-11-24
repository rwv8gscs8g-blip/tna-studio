# TNA Studio

Plataforma segura para gerenciamento de galerias fotográficas com controle de acesso granular, armazenamento privado e sessões efêmeras.

## 🎯 Visão Geral

Sistema desenvolvido para gerenciar sessões fotográficas com:
- **Galerias por sessão** - Uma galeria = uma sessão fotográfica
- **Termo de autorização** - PDF obrigatório por galeria
- **Armazenamento privado** - Cloudflare R2 com URLs assinadas
- **Acesso controlado** - Modelos veem apenas suas galerias
- **Sessões seguras** - Expiração automática e revogação

## 🏗️ Stack Tecnológico

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Autenticação**: NextAuth.js v5 (JWT, Credentials Provider)
- **Segurança**: Certificado Digital A1 ICP-Brasil (obrigatório para escrita admin)
- **Banco de Dados**: PostgreSQL (Neon) + Prisma ORM
- **Storage**: Cloudflare R2 (S3-compatible)
- **Comunicação**: Twilio (SMS, WhatsApp, Email) - Fase 4
- **Deploy**: Vercel (Edge + Node.js runtimes)
- **Validação**: Zod + react-hook-form

## 🚀 Quick Start

### Opção A: Instalação Automática (Recomendado)

```bash
# Dar permissão de execução
chmod +x scripts/setup-local.sh

# Executar setup completo
./scripts/setup-local.sh
```

O script faz automaticamente:
- ✅ Verifica pré-requisitos (Node.js, npm, openssl)
- ✅ Cria/valida `.env.local`
- ✅ Instala dependências
- ✅ Configura banco de dados (migrations + Prisma Client)
- ✅ Cria usuários de teste (incluindo SUPER_ADMIN)
- ✅ Valida segurança (pré-start, certificado A1)
- ✅ Limpa cache

**Após o setup**, inicie o servidor:
```bash
npm run dev
```

### Opção B: Instalação Manual

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie `.env.local` na raiz (copie de `.env.local.example`):

```env
# Banco de dados (OBRIGATÓRIO)
# IMPORTANTE: Use bancos separados para DEV e PROD
# - Desenvolvimento local: banco Neon DEV separado
# - Produção (Vercel): banco Neon PROD (configurado via variáveis de ambiente do Vercel)
DATABASE_URL="postgresql://user:pass@host:port/database?sslmode=require"
DIRECT_URL="postgresql://user:pass@host:port/database?sslmode=require"

# Autenticação (OBRIGATÓRIO)
NEXTAUTH_SECRET="gerar_com_openssl_rand_base64_32"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true

# Certificado A1 ICP-Brasil (OBRIGATÓRIO para escrita admin)
CERT_A1_FILE_PATH=./secrets/certs/assinatura_a1.pfx
CERT_A1_PASSWORD="***NAO_COMMITAR***"
CERT_A1_OWNER_NAME="LUIS MAURICIO JUNQUEIRA ZANIN"
CERT_A1_ENFORCE_WRITES=true

# Modo de teste (logs extras)
SECURITY_TEST_MODE=true

# Storage R2 (opcional em dev - usa modo mock)
CLOUDFLARE_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="tna-studio-media"

# Twilio (Fase 4 - opcional por enquanto)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
TWILIO_WHATSAPP_NUMBER=""
SENDGRID_API_KEY="" # ou RESEND_API_KEY
EMAIL_FROM="noreply@tna.studio"
EMAIL_TO_AUDIT="token@zanin.art.br"
WHATSAPP_TO_AUDIT="[redacted-phone]"
```

### 3. Configuração de Banco de Dados

**⚠️ CRÍTICO: Separação de Ambientes**

O TNA-Studio requer **bancos de dados separados** para desenvolvimento e produção:

- **Desenvolvimento Local:**
  - Crie um banco Neon separado para desenvolvimento
  - Configure `DATABASE_URL` e `DIRECT_URL` no `.env.local` apontando para este banco DEV
  - Este banco pode ser resetado, populado com seed, e usado para testes sem risco

- **Produção (Vercel):**
  - Use um banco Neon **diferente** para produção
  - Configure `DATABASE_URL` e `DIRECT_URL` nas variáveis de ambiente do Vercel
  - **NUNCA** execute `npm run seed` em produção (proteção automática implementada)
  - **NUNCA** execute `npx prisma migrate reset` em produção

**Proteções Implementadas:**
- ✅ Seed bloqueado automaticamente em `NODE_ENV=production`
- ✅ Operações destrutivas protegidas por `env-guard.ts`
- ✅ Validação de ambiente antes de operações críticas

**Gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3.1. Configuração de Banco de Dados

**⚠️ CRÍTICO: Separação de Ambientes**

O TNA-Studio requer **bancos de dados separados** para desenvolvimento e produção:

- **Desenvolvimento Local:**
  - Crie um banco Neon separado para desenvolvimento
  - Configure `DATABASE_URL` e `DIRECT_URL` no `.env.local` apontando para este banco DEV
  - Este banco pode ser resetado, populado com seed, e usado para testes sem risco

- **Produção (Vercel):**
  - Use um banco Neon **diferente** para produção
  - Configure `DATABASE_URL` e `DIRECT_URL` nas variáveis de ambiente do Vercel
  - **NUNCA** execute `npm run seed` em produção (proteção automática implementada)
  - **NUNCA** execute `npx prisma migrate reset` em produção

**Proteções Implementadas:**
- ✅ Seed bloqueado automaticamente em `NODE_ENV=production`
- ✅ Operações destrutivas protegidas por `env-guard.ts`
- ✅ Validação de ambiente antes de operações críticas

**Comandos para Desenvolvimento:**
```bash
# Rodar migrations (banco DEV)
npx prisma migrate deploy

# Gerar Prisma Client
npx prisma generate

# Criar usuários de teste (inclui SUPER_ADMIN) - APENAS EM DEV
npm run seed
```

**Usuários criados:**
- `super@tna.studio` / `Super@2025!` (SUPER_ADMIN)
- `admin@tna.studio` / `Admin@2025!` (ADMIN)
- `model1@tna.studio` / `Model1@2025!` (MODEL)
- `client1@tna.studio` / `Client1@2025!` (CLIENT)

### 4. Validação Pré-Start (Obrigatória)

**IMPORTANTE**: Antes de iniciar o servidor, o script de validação pré-start é executado automaticamente.

**O que valida:**
- Schema Prisma (hash de migrations)
- Versão do código (Git commit SHA)
- Versionamento interno (AppConfig)
- Ambiente (localhost vs produção)

**Como usar:**
```bash
# Validação manual
npm run validate

# Desenvolvimento (validação automática)
npm run dev

# Desenvolvimento sem validação (NÃO RECOMENDADO - apenas emergências)
npm run dev:unsafe
```

**Se validação falhar:**
- Script bloqueia o boot
- Exibe instruções de sincronização
- Pode restaurar automaticamente (se `AUTO_RESTORE=true`)

### 5. Iniciar Servidor

```bash
npm run dev
```

Acesse `http://localhost:3000`

**Importante**: Certificado A1 é obrigatório para operações administrativas. Configure `CERT_A1_FILE_PATH` e `CERT_A1_PASSWORD` em `.env.local`.

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (Node.js runtime)
│   │   ├── auth/          # NextAuth handlers
│   │   ├── galleries/     # CRUD de galerias
│   │   ├── media/         # Upload e URLs assinadas
│   │   └── session/       # Tokens efêmeros
│   ├── components/        # Componentes React
│   ├── galleries/         # Páginas de galerias
│   ├── model/             # Área da modelo (Fase 3)
│   ├── admin/             # Painel administrativo
│   └── profile/           # Perfil do usuário
├── lib/
│   ├── prisma.ts          # Singleton Prisma Client
│   ├── r2.ts              # Cliente R2 (S3-compatible)
│   ├── validators.ts      # Validações (CPF, telefone, etc.)
│   ├── otp.ts             # Geração e validação de OTP
│   └── image-rights.ts    # Validação de permissões
├── middleware.ts           # Proteção de rotas (Edge Runtime)
└── auth.ts                # Configuração NextAuth
```

## 🔐 Segurança

### Sessões

- **Admin**: 10 minutos
- **Modelo/Cliente**: 5 minutos
- **Extensões**: +5min (tela), +30min (Sync.com)
- **Limite total**: 2 horas por login
- **Validação**: 100% no servidor (cliente não é confiável)

### Armazenamento

- **R2 privado**: Sem acesso público direto
- **URLs assinadas**: Expiração de 1 hora
- **Validação**: Permissões verificadas antes de gerar URL

### Validações

- **CPF**: Formato + dígitos verificadores
- **Telefone**: E.164 (+CC DDD Nº)
- **Passaporte**: ICAO (2 letras + 6-9 alfanuméricos)
- **Email**: RFC 5322
- **Senha**: 8+ chars, maiúscula, minúscula, número, símbolo

## 📊 Funcionalidades

### Atuais (MVP)

- ✅ Login com email/senha
- ✅ Sessão com timer visual
- ✅ Criação de galerias
- ✅ Upload de fotos (até 10 MB)
- ✅ Painel administrativo básico

### Em Desenvolvimento (Fase 2-3)

- 🔄 Galerias com termo de autorização
- 🔄 Estrutura 3 colunas (Thumbnail | Termo | Sync.com)
- 🔄 Área da modelo (`/model`)
- 🔄 Upload de termo PDF (obrigatório)
- 🔄 Grid responsivo de fotos

### Planejadas (Fase 4+)

- 📋 Login por SMS/WhatsApp (Twilio)
- 📋 2FA completo
- 📋 Sistema de auditoria
- 📋 Gateway Sync.com
- 📋 Lightbox custom

## 🚢 Deploy

### Variáveis Obrigatórias (Vercel)

- `DATABASE_URL`, `DIRECT_URL`
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `AUTH_TRUST_HOST`
- `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`

### Build e Deploy

```bash
# Testar build local
npm run build

# Deploy na Vercel
vercel --prod
```

**Limitações:**
- Middleware < 1 MB (Vercel free plan)
- Edge Runtime (sem Prisma direto)

## 🔐 Arquitetura de Segurança

### Banco de Dados Unificado

**Um único banco Neon** compartilhado entre localhost e produção:

- ✅ **DATABASE_URL** e **DIRECT_URL** apontam para o mesmo banco
- ✅ **Localhost e produção** são dois "clientes" diferentes
- ✅ **Integridade garantida** por:
  - Script pré-start (valida schema, código, migrations)
  - Version-guards (valida versões antes de escrita)
  - AdminSession (rastreia ambiente e versões)
  - Certificado A1 obrigatório (validação jurídica)

**Estratégia de Rollback:**
- Neon Branching para isolamento e testes
- Point-in-Time Restore disponível
- Backup lógico periódico (`scripts/backup/backup-logico.sh`)

**Documentação**: `docs/NEON-BRANCHING-STRATEGY.md`

### Certificado Digital A1 ICP-Brasil (Obrigatório)

**Por que Certificado A1 é obrigatório para operações administrativas:**

1. **Validade Jurídica Plena** (Lei 14.063/2020)
   - Fornece força probatória no Brasil
   - Reconhecido internacionalmente pela cadeia ICP-Brasil
   - Equivalente ao mecanismo usado por plataformas críticas do governo (e-CAC, SEFAZ, eSocial)

2. **Não-Repúdio**
   - Garantido pela cadeia ICP-Brasil
   - WebAuthn não fornece não-repúdio (limitação técnica)
   - Cada operação pode ser rastreada ao certificado específico

3. **Assinatura Digital**
   - Permite assinatura criptográfica de ações administrativas
   - Criar galeria, subir fotos, enviar termo, editar dados de modelos
   - Todas operações críticas são assinadas digitalmente

4. **Auditoria e Conformidade**
   - Comprova identidade do administrador perante auditorias
   - Atende obrigações legais (LGPD/GDPR)
   - Protege em disputas judiciais futuras

5. **Proteção contra Alterações Indevidas**
   - Previne intrusões não autorizadas
   - Evita conflitos entre ambientes (localhost/produção)
   - Desestimula acessos simultâneos

**Referências Legais:**
- Lei 14.063/2020: Dispositivos de segurança da informação
- MP 2.200-2/2001: Infraestrutura de Chaves Públicas Brasileira (ICP-Brasil)
- ICP-Brasil: https://www.gov.br/iti/pt-br/assuntos/repositorio/icp-brasil

**Configuração:**
```env
CERT_A1_FILE_PATH=./secrets/certs/assinatura_a1.pfx
CERT_A1_PASSWORD="***NAO_COMMITAR***"
CERT_A1_ENFORCE_WRITES=true
```

**Sem certificado válido**: Operações administrativas são **BLOQUEADAS** (hard fail → 403)

### Seis Camadas de Verificação

Toda operação administrativa de escrita deve passar por **6 camadas obrigatórias**:

1. ✅ **Certificado A1** - Válido, ICP-Brasil, associado ao admin
2. ✅ **Login do Admin** - Sessão válida, token JWT válido
3. ✅ **Script Pré-Start** - Validação executada, sincronizado
4. ✅ **Ambiente** - Localhost não conectado à produção
5. ✅ **Guard de Versão** - Código e migrations correspondem
6. ✅ **Integridade do Schema** - Hash do schema corresponde

**Nenhuma operação administrativa pode ser executada sem passar por todas as 6 camadas.**

### Neon Branching

**Estratégia de Isolamento:**
- Isolamento para testar migrations
- Prevenção de corrupção acidental
- Rollback rápido
- Teste de versões antes do merge

**Documentação Neon**: https://neon.tech/docs/branching

### Super User (SUPER_ADMIN)

**Papel:**
- **PODE executar** operações administrativas (com Certificado A1)
- **PODE gerenciar** certificados A1 (registrar/atualizar)
- **PODE criar/editar** usuários ADMIN
- **PODE atualizar** AppConfig (versões autorizadas)
- **Atua como guardião** do mecanismo de confiança

**Login de teste:**
- Email: `super@tna.studio`
- Senha: `Super@2025!`

**Diferença de ADMIN:**
- ADMIN: Executa operações (com A1), mas não gerencia certificados
- SUPER_ADMIN: Tudo que ADMIN faz + gerencia certificados e AppConfig

## 📚 Documentação

- **`README.md`** - Este documento (visão geral e setup)
- **`ARQUITETURA.md`** - Arquitetura técnica detalhada
- **`SEGURANCA.md`** - Arquitetura de segurança detalhada (Certificado A1, 6 camadas, etc.)
- **`DECISOES-CONSOLIDADAS.md`** - Decisões de produto e ordem de implementação
- **`INTEGRACAO-TWILIO-PASSO-A-PASSO.md`** - Guia de integração Twilio (Fase 4)
- **`AVALIACAO-ARQUITETURA-FINAL.md`** - Avaliação técnica completa da arquitetura

## 🗺️ Roadmap

### Fase 2: Galerias (🔄 Atual)
- Criar galeria com data de sessão
- Upload de termo PDF
- Upload de fotos (até 30, validação de termo)
- Estrutura 3 colunas responsiva

### Fase 3: Área da Modelo
- Página `/model` com perfil e galerias
- Subpáginas de galerias
- Edição de perfil
- Mensagens do admin

### Fase 4: Integração Twilio
- SMS/WhatsApp para login
- Email para auditoria
- 2FA completo

### Fase 5+: Autenticação Avançada, Auditoria, Sync.com

---

**Versão**: 0.2.0 (Reconstrução)
**Status**: Fase 2 em desenvolvimento
