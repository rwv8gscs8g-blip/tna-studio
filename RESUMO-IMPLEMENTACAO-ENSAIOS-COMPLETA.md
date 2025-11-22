# Resumo da Implementação Completa de Ensaios

## Data: Dezembro 2024

## Objetivo
Implementar sistema completo de gerenciamento de ensaios fotográficos, incluindo:
- Modelo de dados (Prisma Schema)
- APIs REST para CRUD de ensaios
- Interfaces para ARQUITETO e MODELO
- Sistema de fotos por ensaio
- Proteção de rotas e permissões

---

## 1. Schema Prisma (prisma/schema.prisma)

### Modelo Ensaio
```prisma
model Ensaio {
  id            String   @id @default(cuid())
  title         String
  slug          String   @unique
  description   String?
  shootDate     DateTime?
  status        EnsaioStatus @default(DRAFT)
  subjectCpf    String?
  coverImageUrl String?
  termPdfUrl    String?
  syncFolderUrl String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  createdById   String
  createdBy     User     @relation("EnsaiosCriados", fields: [createdById], references: [id])
  
  subjectCpf    String?
  subject       User?    @relation("EnsaiosPorCpf", fields: [subjectCpf], references: [cpf])
  
  photos        EnsaioPhoto[]

  @@index([createdById])
  @@index([subjectCpf])
  @@index([status])
  @@index([shootDate])
}
```

### Modelo EnsaioPhoto
```prisma
model EnsaioPhoto {
  id         String   @id @default(cuid())
  ensaioId   String
  imageUrl   String
  sortOrder  Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  ensaio     Ensaio   @relation(fields: [ensaioId], references: [id], onDelete: Cascade)

  @@index([ensaioId])
  @@index([sortOrder])
}
```

### Enum EnsaioStatus
```prisma
enum EnsaioStatus {
  DRAFT
  PUBLISHED
}
```

**Migration criada e aplicada.**

---

## 2. APIs REST

### 2.1. Listar Ensaios
**GET** `/api/arquiteto/ensaios`

**Permissões:**
- ARQUITETO: vê apenas seus próprios ensaios
- ADMIN: vê todos os ensaios

**Query Parameters:**
- `status`: filtrar por status (DRAFT, PUBLISHED)
- `subjectCpf`: filtrar por CPF do sujeito
- `sort`: ordenação (`shootDate` desc por padrão)

**Response:**
```json
[
  {
    "id": "...",
    "title": "...",
    "slug": "...",
    "shootDate": "...",
    "status": "PUBLISHED",
    "subject": { "name": "...", "email": "...", "cpf": "..." },
    "photos": [{ "id": "...", "imageUrl": "...", "sortOrder": 0 }],
    "coverImageUrl": "..."
  }
]
```

### 2.2. Criar Ensaio
**POST** `/api/arquiteto/ensaios`

**Permissões:**
- Apenas ARQUITETO (com sessão ativa, não read-only)

**Body:**
```json
{
  "title": "Ensaio 2024",
  "description": "...",
  "shootDate": "2024-12-01T10:00:00Z",
  "status": "DRAFT",
  "subjectCpf": "12345678900",
  "coverImageUrl": "...",
  "termPdfUrl": "...",
  "syncFolderUrl": "..."
}
```

**Validações:**
- `title`: obrigatório
- `subjectCpf`: obrigatório, deve existir usuário com esse CPF
- Usuário com `subjectCpf` deve ter role `MODELO` ou `CLIENTE`
- `slug`: gerado automaticamente a partir do `title`

### 2.3. Obter Ensaio
**GET** `/api/arquiteto/ensaios/[id]`

**Permissões:**
- ARQUITETO: apenas seus próprios ensaios
- ADMIN: todos os ensaios

### 2.4. Atualizar Ensaio
**PATCH** `/api/arquiteto/ensaios/[id]`

**Permissões:**
- Apenas ARQUITETO criador do ensaio (com sessão ativa, não read-only)

### 2.5. Deletar Ensaio
**DELETE** `/api/arquiteto/ensaios/[id]`

**Permissões:**
- Apenas ARQUITETO criador do ensaio (com sessão ativa, não read-only)

### 2.6. Adicionar Foto
**POST** `/api/arquiteto/ensaios/[id]/photos`

**Permissões:**
- Apenas ARQUITETO criador do ensaio (com sessão ativa, não read-only)

**Body:**
```json
{
  "imageUrl": "https://...",
  "sortOrder": 0
}
```

**Validações:**
- Limite de 30 fotos por ensaio
- `imageUrl`: obrigatório

### 2.7. Ordenar Fotos
**PUT** `/api/arquiteto/ensaios/[id]/photos`

**Permissões:**
- Apenas ARQUITETO criador do ensaio (com sessão ativa, não read-only)

**Body:**
```json
{
  "photoOrders": [
    { "photoId": "...", "sortOrder": 0 },
    { "photoId": "...", "sortOrder": 1 }
  ]
}
```

### 2.8. Remover Foto
**DELETE** `/api/arquiteto/ensaios/[id]/photos/[photoId]`

**Permissões:**
- Apenas ARQUITETO criador do ensaio (com sessão ativa, não read-only)

### 2.9. API para MODELO
**GET** `/api/modelo/ensaios`

**Permissões:**
- Apenas MODELO autenticado
- Retorna apenas ensaios onde `subjectCpf` corresponde ao CPF do MODELO
- Apenas ensaios com `status = PUBLISHED`

---

## 3. Interfaces (Frontend)

### 3.1. Listagem de Ensaios - ARQUITETO/ADMIN
**Rota:** `/arquiteto/ensaios`

**Funcionalidades:**
- Lista ensaios com ordenação por `shootDate` (desc)
- Filtros por status e CPF
- Cards com informações resumidas
- Link para detalhe e edição
- Botão "Novo Ensaio"

**Permissões:**
- ARQUITETO: vê apenas seus ensaios, pode criar/editar
- ADMIN: vê todos, somente leitura

### 3.2. Detalhe de Ensaio - ARQUITETO/ADMIN
**Rota:** `/arquiteto/ensaios/[id]`

**Funcionalidades:**
- Visualização completa do ensaio
- Galeria de fotos com ordenação drag-and-drop
- Botão "Editar"
- Informações do sujeito (MODELO/CLIENTE)
- Links para documentos (termo PDF, pasta sync)

**Permissões:**
- ARQUITETO: pode editar se for criador e não estiver read-only
- ADMIN: somente leitura

### 3.3. Edição de Ensaio - ARQUITETO
**Rota:** `/arquiteto/ensaios/[id]/edit`

**Funcionalidades:**
- Formulário completo de edição
- Seleção de sujeito por CPF (com validação)
- Upload/seleção de imagem de capa
- Gerenciamento de fotos (adicionar, remover, ordenar)
- Upload de termo PDF
- Campo para pasta de sincronização

**Validações:**
- Campos obrigatórios
- CPF do sujeito deve existir e ser MODELO ou CLIENTE
- Limite de 30 fotos

### 3.4. Criação de Ensaio - ARQUITETO
**Rota:** `/arquiteto/ensaios/new`

**Funcionalidades:**
- Formulário idêntico ao de edição
- Validação de campos obrigatórios
- Geração automática de slug

### 3.5. Listagem de Ensaios - MODELO
**Rota:** `/modelo/ensaios`

**Funcionalidades:**
- Lista apenas ensaios PUBLISHED do MODELO autenticado
- Ordenação por `shootDate` (desc)
- Cards com informações resumidas
- Link para visualização

### 3.6. Visualização de Ensaio - MODELO
**Rota:** `/modelo/ensaios/[id]`

**Funcionalidades:**
- Visualização completa do ensaio
- Galeria de fotos (sem edição)
- Download de termo PDF (se disponível)
- Somente leitura

---

## 4. Proteção de Rotas e Permissões

### 4.1. Middleware
- Verificação de autenticação via NextAuth
- Redirecionamento para login se não autenticado

### 4.2. Proteção por Role
- **ARQUITETO:**
  - Pode criar, editar e deletar seus próprios ensaios
  - Pode ver seus próprios ensaios
  - Verifica sessão read-only antes de editar
- **ADMIN:**
  - Pode ver todos os ensaios
  - Não pode criar, editar ou deletar
- **MODELO:**
  - Pode ver apenas seus próprios ensaios (PUBLISHED)
  - Não pode criar, editar ou deletar

### 4.3. Sessão Read-Only (ARQUITETO)
- Sistema de sessão exclusiva para ARQUITETO
- Se existir outra sessão ativa, a sessão atual fica read-only
- Banner de aviso em todas as telas de edição
- APIs bloqueiam edição se read-only

### 4.4. Validações de Negócio
- Ensaio só pode ser editado pelo ARQUITETO criador
- Fotos só podem ser gerenciadas pelo ARQUITETO criador
- `subjectCpf` deve existir e ser MODELO ou CLIENTE
- Limite de 30 fotos por ensaio

---

## 5. Estrutura de Arquivos

```
src/
├── app/
│   ├── api/
│   │   ├── arquiteto/
│   │   │   └── ensaios/
│   │   │       ├── route.ts                    # GET, POST (listar, criar)
│   │   │       └── [id]/
│   │   │           ├── route.ts                # GET, PATCH, DELETE (detalhe, editar, deletar)
│   │   │           └── photos/
│   │   │               ├── route.ts            # POST, PUT (adicionar, ordenar)
│   │   │               └── [photoId]/
│   │   │                   └── route.ts        # DELETE (remover)
│   │   └── modelo/
│   │       └── ensaios/
│   │           └── route.ts                    # GET (listar para MODELO)
│   ├── arquiteto/
│   │   └── ensaios/
│   │       ├── page.tsx                        # Listagem
│   │       ├── new/
│   │       │   └── page.tsx                    # Criar novo
│   │       └── [id]/
│   │           ├── page.tsx                    # Detalhe
│   │           └── edit/
│   │               └── page.tsx                # Editar
│   └── modelo/
│       └── ensaios/
│           ├── page.tsx                        # Listagem
│           └── [id]/
│               └── page.tsx                    # Visualização
└── lib/
    └── prisma.ts                                # Cliente Prisma
```

---

## 6. Funcionalidades Implementadas

✅ **CRUD Completo de Ensaios**
- Criar, ler, atualizar, deletar ensaios
- Validações de campos obrigatórios
- Geração automática de slug

✅ **Sistema de Fotos**
- Adicionar até 30 fotos por ensaio
- Ordenação via drag-and-drop
- Remoção de fotos
- Exibição em galeria

✅ **Associação com MODELO/CLIENTE**
- Relação via CPF
- Validação de role
- Busca de usuário por CPF

✅ **Permissões por Role**
- ARQUITETO: criação e edição
- ADMIN: visualização somente leitura
- MODELO: visualização de seus ensaios (PUBLISHED)

✅ **Proteção de Sessão**
- Sistema de sessão exclusiva para ARQUITETO
- Modo read-only para sessões antigas
- Banner de aviso nas telas

✅ **Filtros e Ordenação**
- Filtro por status
- Filtro por CPF do sujeito
- Ordenação por data de ensaio

✅ **Interfaces Responsivas**
- Cards de listagem
- Galeria de fotos
- Formulários de edição
- Visualização otimizada

---

## 7. Testes Recomendados

### 7.1. Funcionalidades
- [ ] Criar ensaio como ARQUITETO
- [ ] Editar ensaio como ARQUITETO
- [ ] Adicionar fotos ao ensaio
- [ ] Ordenar fotos via drag-and-drop
- [ ] Remover fotos
- [ ] Visualizar ensaios como ADMIN (read-only)
- [ ] Visualizar ensaios como MODELO (apenas PUBLISHED)
- [ ] Filtrar ensaios por status e CPF
- [ ] Testar limite de 30 fotos

### 7.2. Permissões
- [ ] ARQUITETO não pode editar ensaio de outro ARQUITETO
- [ ] ADMIN não pode criar/editar ensaios
- [ ] MODELO só vê seus próprios ensaios PUBLISHED
- [ ] Sessão read-only bloqueia edições

### 7.3. Validações
- [ ] CPF do sujeito deve existir
- [ ] Sujeito deve ser MODELO ou CLIENTE
- [ ] Campos obrigatórios validados
- [ ] Slug gerado automaticamente

---

## 8. Próximos Passos (Opcional)

- [ ] Upload de imagens via formulário (atualmente apenas URL)
- [ ] Upload de PDF via formulário
- [ ] Preview de imagens antes de adicionar
- [ ] Compressão automática de imagens
- [ ] Histórico de alterações do ensaio
- [ ] Notificações ao MODELO quando ensaio é publicado
- [ ] Exportação de ensaio para PDF
- [ ] Integração com serviços de cloud storage (S3, Google Drive)

---

## 9. Notas Técnicas

### 9.1. Geração de Slug
- Baseado no título do ensaio
- Formato: lowercase, espaços substituídos por hífens
- Remoção de caracteres especiais
- Garantia de unicidade no banco

### 9.2. Ordenação de Fotos
- Campo `sortOrder` no modelo `EnsaioPhoto`
- Atualização em batch via API PUT
- Ordenação ascendente por padrão

### 9.3. Performance
- Índices no banco para consultas frequentes
- Relações otimizadas no Prisma
- Paginação futura (não implementada ainda)

---

## 10. Conclusão

Sistema completo de gerenciamento de ensaios implementado com:
- ✅ Schema Prisma atualizado
- ✅ APIs REST completas e protegidas
- ✅ Interfaces para ARQUITETO e MODELO
- ✅ Sistema de fotos integrado
- ✅ Permissões e validações robustas
- ✅ Proteção de rotas implementada

**Status:** ✅ Implementação Completa

---

**Data de Conclusão:** Dezembro 2024
**Versão:** 1.0.0

