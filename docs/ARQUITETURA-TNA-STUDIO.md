# Arquitetura TNA Studio

## 🎯 Visão Geral

Plataforma segura para gerenciamento de ensaios fotográficos com controle de acesso granular, armazenamento privado e auditoria completa.

## 🏗️ Stack Tecnológico

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Autenticação**: NextAuth.js v5 (JWT, Credentials Provider)
- **Banco de Dados**: PostgreSQL (Neon) + Prisma ORM
- **Storage**: Cloudflare R2 (S3-compatible)
- **Deploy**: Vercel (Edge + Node.js runtimes)

## 📁 Organização de Pastas

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (Node.js runtime)
│   │   ├── arquiteto/     # Rotas do ARQUITETO (ensaios, solicitações)
│   │   ├── admin/         # Rotas do ADMIN (usuários, relatórios)
│   │   ├── modelo/        # Rotas do MODELO/CLIENTE (solicitações)
│   │   ├── ensaios/       # Rotas de ensaios (cover, term, etc.)
│   │   └── auth/          # NextAuth handlers
│   ├── arquiteto/         # Páginas do ARQUITETO
│   │   ├── relatorios/    # Dashboard principal
│   │   ├── ensaios/       # CRUD de ensaios
│   │   └── solicitacoes/  # Aprovação de solicitações
│   ├── admin/             # Páginas do ADMIN (somente leitura)
│   ├── modelo/            # Páginas do MODELO/CLIENTE
│   ├── loja/              # Loja de produtos
│   ├── projetos/          # Gestão de projetos
│   ├── secure/            # Rotas seguras (Sync.com encapsulado)
│   └── components/        # Componentes React compartilhados
├── lib/
│   ├── prisma.ts          # Singleton Prisma Client
│   ├── r2.ts              # Cliente R2 (upload, signed URLs)
│   └── validators.ts      # Validações (CPF, telefone, etc.)
├── middleware.ts          # Proteção de rotas (Edge Runtime)
└── auth.ts                # Configuração NextAuth
```

## 👥 Roles e Permissões

### ARQUITETO
- **Pode alterar tudo**, exceto certificado digital
- Aprova alterações de dados das modelos/clientes
- Administra ensaios, produtos, projetos, loja, contratos
- Cria, edita e deleta ensaios (soft delete)
- Limpa ensaios deletados há mais de 7 dias
- Redirecionamento: `/arquiteto/relatorios`

### ADMIN
- **Somente leitura** (relatórios, avisos, visualização)
- Não pode criar, editar ou aprovar nada
- Visualiza relatórios e avisos do sistema
- Redirecionamento: `/admin/relatorios`

### SUPERADMIN
- Pode alterar **SOMENTE** o certificado digital
- Redirecionamento: `/superadmin/certificado`

### MODELO e CLIENTE
- Não podem editar dados estruturais diretamente
- Podem **solicitar alterações** de dados pessoais via `/modelo/solicitar-alteracao`
- Visualizam seus ensaios publicados em `/modelo/ensaios`
- Acessam contratos em `/modelo/contratos`
- Navegam loja em `/loja`
- Visualizam projetos em `/modelo/projetos`
- Redirecionamento: `/modelo/home`

## 🔄 Fluxos Principais

### 1. Autenticação

**Login:**
- Email + Senha (padrão atual)
- NextAuth.js com JWT
- Redirecionamento automático conforme role após login

**Sessões:**
- ARQUITETO: 60 minutos (desenvolvimento: 24 horas)
- ADMIN: 30 minutos
- MODELO/CLIENTE: 10 minutos
- Validação 100% no servidor

### 2. Ensaios (DRAFT / PUBLISHED / DELETED)

**Enum EnsaioStatus:**
- `DRAFT`: Rascunho - não exibido para MODELO/CLIENTE
- `PUBLISHED`: Publicado - visível para quem tem permissão
- `DELETED`: Deletado (soft delete) - não exibido por padrão

**Criação de Ensaio (ARQUITETO):**
1. Acessar `/arquiteto/ensaios/new`
2. Buscar modelo/cliente (por nome, email ou CPF)
3. Preencher dados: data, título, projetos (multi-select), produtos (multi-select)
4. Upload de capa (até 10MB)
5. Upload de termo PDF (até 10MB)
6. Upload de mini-galeria (até 5 fotos, 10MB cada)
7. Configurar link Sync.com (opcional)
8. Salvar → cria ensaio com status `DRAFT` ou `PUBLISHED`

**Visualização (MODELO/CLIENTE):**
- Apenas ensaios com status `PUBLISHED` são exibidos
- Acessam via `/modelo/ensaios`
- Podem baixar contrato via URL efêmera

**Deleção Lógica:**
- ARQUITETO marca ensaio como `DELETED`
- Ensaio não é exibido para MODELO/CLIENTE
- ARQUITETO pode limpar definitivamente após 7 dias via `/api/arquiteto/ensaios/limpar-deletados`
- Limpeza remove arquivos do R2 e registros do banco

### 3. Sistema de Solicitação de Alteração de Dados

**Fluxo:**
1. MODELO/CLIENTE acessa `/modelo/solicitar-alteracao`
2. Preenche campos permitidos:
   - Telefone
   - Endereço (street, number, city, state, zip, country)
   - Nome social
   - Passaporte
   - Documentos complementares
   - Email principal
   - **NÃO pode alterar CPF**
3. Submete solicitação → cria `ModelChangeRequest` com status `PENDING`
4. ARQUITETO recebe aviso em `/avisos`
5. ARQUITETO acessa `/arquiteto/solicitacoes`
6. ARQUITETO aprova ou rejeita:
   - **Aprovar**: Atualiza dados do usuário, cria registro em `ModelAuditHistory`
   - **Rejeitar**: Atualiza status para `REJECTED` com motivo

**Modelos de Dados:**
- `ModelChangeRequest`: Solicitações pendentes/aprovadas/rejeitadas
- `ModelAuditHistory`: Histórico completo de alterações aprovadas

### 4. Contratos

**Visualização (MODELO/CLIENTE):**
- Acessam `/modelo/contratos`
- Veem lista de contratos assinados (ensaios com `termPdfKey`)
- Cada contrato mostra: data do ensaio, capa, botão de download

**Download:**
- Botão gera URL efêmera via `/api/ensaios/[id]/term`
- URL expira em 60-120 segundos
- Validação de sessão e role antes de gerar URL

### 5. Loja de Produtos

**Produtos:**
- 10 produtos pré-cadastrados no seed
- Cada produto pode ter até 5 fotos
- Produtos podem ser associados a ensaios (N:N)

**Permissões:**
- **MODELO/CLIENTE**: Visualizam produtos, criam intenções de compra (`IntencaoCompra`)
- **ARQUITETO**: CRUD completo (criar, editar, deletar, upload de fotos)
- **ADMIN**: Somente leitura

### 6. Projetos

**Projetos:**
- Projetos temáticos (ex: "Envelhecer", "Câncer de Mama")
- Cada ensaio pode ter múltiplos projetos associados (N:N)
- Projetos podem ser ativados/desativados

**Permissões:**
- **MODELO/CLIENTE**: Visualizam projetos que participam
- **ARQUITETO**: CRUD completo, associação a ensaios
- **ADMIN**: Somente leitura

## 📊 Modelo de Dados Principal

### Ensaio
- `id`, `title`, `slug`, `description`
- `shootDate`: Data do ensaio
- `subjectCpf`: CPF do modelo/cliente
- `coverImageKey`: Chave R2 da capa
- `termPdfKey`: Chave R2 do termo PDF
- `syncFolderUrl`: Link do Sync.com (nunca exposto diretamente)
- `status`: `EnsaioStatus` (DRAFT, PUBLISHED, DELETED)
- `d4signDocumentId`: ID do documento D4Sign (futuro)
- Relações: `subject` (User), `photos` (EnsaioPhoto[]), `projetos` (Projeto[]), `produtos` (Produto[])

### User
- Campos básicos: `email`, `name`, `cpf`, `phone`, `birthDate`
- Campos estilo Apple Contacts: `firstName`, `middleName`, `lastName`, `organization`, `jobTitle`, `phones[]`, `emails[]`, `birthday`, `postalAddress`
- `role`: ARQUITETO, ADMIN, MODELO, CLIENTE, SUPERADMIN
- Relações: `ModelChangeRequests[]`, `ModelAuditHistory[]`

### ModelChangeRequest
- `userId`: Usuário que solicitou
- `campo`: Campo a ser alterado (ex: "phone", "address")
- `oldValue`, `requestedValue`: Valores antigo e solicitado
- `status`: PENDING, APPROVED, REJECTED
- `approvedById`: ARQUITETO que aprovou/rejeitou
- `rejectionReason`: Motivo da rejeição (se aplicável)

### ModelAuditHistory
- `userId`: Usuário alterado
- `fieldModified`: Campo modificado
- `valueBefore`, `valueAfter`: Valores antes e depois
- `approvedById`: ARQUITETO que aprovou
- `timestamp`: Data/hora da alteração

## 🔐 Segurança

### URLs Efêmeras
- Todos os arquivos são servidos via URLs assinadas (R2)
- Expiração curta (60-120 segundos)
- Validação de sessão e role antes de gerar URL
- Nunca expor URLs diretas do R2

### Sync.com Encapsulado
- Links do Sync.com nunca são abertos diretamente
- Rota protegida `/secure/sync/[id]` valida sessão/role
- Conteúdo carregado em iframe com sandbox
- Previne escape de conteúdo

### Middleware
- Protege todas as rotas internas (`/arquiteto/*`, `/admin/*`, `/modelo/*`, `/avisos`)
- Verifica cookie de sessão
- Validação completa de role nas páginas via `auth()`

## 📚 Referências

- **Next.js 15**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **NextAuth.js**: https://next-auth.js.org
- **Cloudflare R2**: https://developers.cloudflare.com/r2

---

**Versão**: 1.0.0
**Última atualização**: 2025-01-25

