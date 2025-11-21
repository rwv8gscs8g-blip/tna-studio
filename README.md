# TNA Studio

Plataforma segura para gerenciamento de conteúdo sensível, construída com Next.js 15, NextAuth.js, PostgreSQL (Neon) e Cloudflare R2.

## 🏗️ Arquitetura Técnica

### Stack Principal

- **Frontend**: Next.js 15 App Router (React 18)
- **Autenticação**: NextAuth.js v5 (Credentials Provider + JWT)
- **Banco de Dados**: PostgreSQL (Neon) com Prisma ORM
- **Storage**: Cloudflare R2 (S3-compatible API)
- **Deploy**: Vercel (Edge + Node.js runtimes)

### Decisões Arquiteturais

#### 1. Sessão e Expiração (100% no Servidor)

**Por que expiração no servidor?**
- Cliente não é confiável para decisões de segurança
- Relógio do cliente pode ser alterado, mas servidor sempre usa seu próprio `Date.now()`
- Validação acontece em cada requisição no callback `jwt` do NextAuth

**Como funciona:**
1. Token JWT criado com `iat` (issued at) e `exp` (expires at = iat + 300s)
2. Em cada requisição, callback `jwt` valida se `token.exp < Date.now()` (servidor)
3. Se expirado, retorna `null` → callback `session` retorna `user: null`
4. Middleware detecta sessão inválida e redireciona para login

**Resultado:** Mesmo que cliente altere relógio, servidor rejeita tokens expirados.

#### 2. Tokens Efêmeros e Build Timestamp

**Por que tokens efêmeros?**
- Previne reutilização de URLs após logout
- URLs não podem ser copiadas/coladas sem token válido
- Cada sessão gera token único que expira em 5 minutos

**Por que build timestamp?**
- Tokens criados antes de restart do servidor são automaticamente inválidos
- Garante que reiniciar servidor invalida todas as sessões antigas
- Singleton global (`global.__BUILD_TIMESTAMP`) persiste entre requisições

**Como funciona:**
- `BUILD_TIMESTAMP` gerado uma vez quando processo Node.js inicia
- Token com `iat < BUILD_TIMESTAMP` é rejeitado
- Middleware limpa cookies automaticamente quando detecta sessão inválida

#### 3. R2 Privado com URLs Assinadas

**Por que R2 é privado?**
- Conteúdo sensível não deve ser acessível publicamente
- URLs diretas permitiriam acesso sem autenticação
- URLs assinadas expiram automaticamente (1 hora padrão)

**Como funciona:**
- Uploads salvos no R2 com `CacheControl: no-cache, no-store`
- URLs geradas via `@aws-sdk/s3-request-presigner` com expiração
- Validação de permissões antes de gerar URL (`canAccessPhoto`)
- Em desenvolvimento: usa rota local `/api/media/serve/[photoId]` (mock)

**Modo Mock vs Produção:**
- **Desenvolvimento**: Sempre usa rota local, mesmo se R2 configurado
- **Produção**: Exige R2 configurado, gera URLs assinadas reais
- Fallback seguro: erro se R2 não configurado em produção

#### 4. Middleware Simplificado (< 1 MB)

**Por que simplificado?**
- Vercel plano gratuito limita middleware a 1 MB
- Removido `BUILD_VERSION` do middleware (não crítico)
- Mantido apenas validação essencial de autenticação

**O que faz:**
- Protege rotas autenticadas (exceto `/signin`, `/api/auth`)
- Redireciona para login se sessão inválida
- Limpa cookies antigos automaticamente
- Adiciona headers de segurança (X-Content-Type-Options, etc.)

**Limitações:**
- Não pode usar Prisma diretamente (Edge Runtime)
- Não pode usar bibliotecas pesadas
- Deve ser assíncrono e rápido

#### 5. Rate Limiting e Validações de Upload

**Validações implementadas:**
- **Tamanho máximo**: 10 MB por arquivo
- **Tipos MIME permitidos**: image/jpeg, image/png, image/webp, image/gif
- **Rate limiting**: 10 uploads por minuto por usuário/IP
- **Logs de auditoria**: userId, tamanho, IP, timestamp, duração

**Por que essas validações?**
- Previne abuso (spam de uploads)
- Protege storage (evita arquivos muito grandes)
- Garante segurança (apenas imagens)
- Facilita debugging (logs estruturados)

## 🚀 Como Rodar Localmente

### 1. Configurar Variáveis de Ambiente

Crie `.env` na raiz do projeto:

```env
# Banco de dados
DATABASE_URL="postgresql://user:pass@host:port/tna_studio"
DIRECT_URL="postgresql://user:pass@host:port/tna_studio"

# Autenticação
NEXTAUTH_SECRET="gerar_com_openssl_rand_base64_32"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true

# Storage R2 (opcional em dev - usa modo mock)
CLOUDFLARE_ACCOUNT_ID="seu_account_id"
R2_ACCESS_KEY_ID="sua_access_key"
R2_SECRET_ACCESS_KEY="sua_secret_key"
R2_BUCKET_NAME="tna-studio-media"
```

**Gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Banco de Dados

```bash
# Rodar migrations
npx prisma migrate dev --name init

# Gerar Prisma Client
npx prisma generate

# (Opcional) Popular com dados de teste
npm run seed
```

### 4. Iniciar Servidor

```bash
npm run dev
```

Acesse `http://localhost:3000`

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
│   │   ├── Navigation.tsx
│   │   ├── SessionTimer.tsx
│   │   └── SignOutButton.tsx
│   ├── galleries/         # Páginas de galerias
│   ├── admin/             # Painel administrativo
│   ├── profile/           # Perfil do usuário
│   └── layout.tsx         # Layout raiz com SessionProvider
├── lib/
│   ├── prisma.ts          # Singleton Prisma Client
│   ├── r2.ts              # Cliente R2 (S3-compatible)
│   ├── r2-secure.ts       # URLs assinadas com validação
│   ├── image-rights.ts    # Validação de permissões
│   ├── image-naming.ts    # Nomenclatura segura (CPF-based)
│   ├── build-version.ts   # Sistema de invalidação por build
│   └── session-tokens.ts  # Tokens efêmeros
├── middleware.ts           # Proteção de rotas (Edge Runtime)
└── auth.ts                # Configuração NextAuth
```

## 🔐 Segurança

### Autenticação

- **Sessão JWT**: 5 minutos (300 segundos)
- **Cookies**: `httpOnly`, `sameSite: lax`, `secure` em produção
- **Rate limiting**: 5 tentativas de login por minuto por IP
- **Validação**: Servidor valida expiração em cada requisição

### Autorização

- **RBAC**: Roles (ADMIN, MODEL, CLIENT)
- **Validação de acesso**: `canAccessGallery`, `canAccessPhoto`
- **Admin**: Acesso total (bypass de validações)

### Storage

- **R2 privado**: Sem acesso público direto
- **URLs assinadas**: Expiração de 1 hora (configurável)
- **Validação**: Permissões verificadas antes de gerar URL

### Middleware

- **Proteção de rotas**: Todas exceto `/signin` e `/api/auth`
- **Limpeza automática**: Cookies antigos removidos
- **Headers de segurança**: X-Content-Type-Options, X-Frame-Options, etc.

## 📊 APIs Principais

### Upload de Mídia

```http
POST /api/media/upload
Content-Type: multipart/form-data

file: File
galleryId: string
sessionId?: string
cpf?: string
```

**Validações:**
- Tamanho máximo: 10 MB
- Tipos permitidos: image/jpeg, image/png, image/webp, image/gif
- Rate limit: 10 uploads/minuto por usuário/IP

### URL Assinada

```http
GET /api/media/sign?photoId={id}&expiresIn={seconds}
```

**Validações:**
- Verifica permissões (`canAccessPhoto`)
- Gera URL assinada do R2 (produção) ou rota local (dev)

### Galerias

```http
GET /api/galleries          # Lista galerias do usuário
POST /api/galleries         # Cria nova galeria
GET /api/galleries/[id]     # Detalhes da galeria
```

## 🚢 Deploy em Produção

### Checklist Completo

Consulte `CHECKLIST-DEPLOY.md` para:
- ✅ Lista completa de variáveis de ambiente
- ✅ Configuração do Cloudflare R2
- ✅ Configuração do Neon PostgreSQL
- ✅ Troubleshooting comum
- ✅ Validação pós-deploy

### Variáveis Obrigatórias

**Vercel Environment Variables:**
- `DATABASE_URL` - Connection string PostgreSQL
- `DIRECT_URL` - Mesma do DATABASE_URL (para migrations)
- `NEXTAUTH_SECRET` - Chave secreta (32+ caracteres)
- `NEXTAUTH_URL` - URL completa da aplicação
- `AUTH_TRUST_HOST` - `true`
- `CLOUDFLARE_ACCOUNT_ID` - ID da conta Cloudflare
- `R2_ACCESS_KEY_ID` - Access Key do R2
- `R2_SECRET_ACCESS_KEY` - Secret Key do R2
- `R2_BUCKET_NAME` - Nome do bucket R2

### Build e Deploy

```bash
# Testar build local
npm run build

# Deploy na Vercel
vercel --prod
```

## ✨ Funcionalidades Atuais

### Autenticação e Sessão
- ✅ Login com NextAuth Credentials
- ✅ Sessão JWT com expiração de 5 minutos
- ✅ SessionTimer visível em todas as páginas
- ✅ Sinalização visual quando falta < 1 minuto
- ✅ Botão para estender sessão em 5 minutos
- ✅ Aviso e redirecionamento quando expira

### Galerias e Mídia
- ✅ Criação de galerias
- ✅ Upload de fotos (até 10 MB)
- ✅ Validação de tipos MIME
- ✅ Rate limiting (10 uploads/minuto)
- ✅ Thumbnails com URLs assinadas (R2)
- ✅ Admin vê todas as galerias

### Administração
- ✅ Painel de usuários (Admin)
- ✅ Relatórios básicos (Admin)
- ✅ Criação manual de usuários

## 📝 Extensões Futuras

O projeto está preparado para receber:

### 2FA (Two-Factor Authentication)
- Fluxos de autenticação em `src/auth.ts`
- Callbacks `jwt` e `session` podem incluir `twoFactorVerified`
- UI em `/profile` para configurar 2FA

### Integração com Twilio / Zenvia / WhatsApp
- Camada de notificações em `src/lib/notifications.ts`
- APIs para envio de SMS/WhatsApp
- Tokens de verificação via SMS

### Servidor SMTP / Email Providers
- Integração com SendGrid, Resend, ou SMTP direto
- Templates de email em `src/lib/emails/`
- Envio de links de verificação, notificações, etc.

### Auditoria Avançada
- Tabela `AuditLog` no Prisma schema
- Middleware de logging em `src/lib/audit.ts`
- Dashboard de auditoria em `/admin/audit`

## 📚 Documentação Adicional

- `CHECKLIST-DEPLOY.md` - Guia completo de deploy
- `ARQUITETURA-SEGURANCA-SESSAO.md` - Detalhes de segurança
- `PONTOS-CRITICOS-DEPLOY.md` - Análise pré-deploy
- `internal/test-pages.md` - Credenciais de teste (não versionado)

## 🤝 Contribuindo

1. Siga a arquitetura de segurança estabelecida
2. Mantenha lógica de segurança no servidor
3. Adicione logs de auditoria para operações críticas
4. Teste com `NODE_ENV=production` antes de deploy

## 📄 Licença

Proprietário - Todos os direitos reservados

---

**Última atualização**: 2025-11-19
**Versão**: 0.1.0 (MVP)
