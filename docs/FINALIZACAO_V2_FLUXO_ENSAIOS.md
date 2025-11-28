# Finalização V2 - Fluxo de Ensaios e Imagens

**Data:** 2025-01-27  
**Versão:** TNA-Studio V2  
**Status:** ✅ Estabilizado

---

## 📋 Resumo Executivo

Este documento descreve o fluxo completo de imagens (capa e galeria) para ensaios fotográficos, incluindo campos do banco de dados, permissões por perfil e funcionalidades implementadas.

---

## 🗄️ Estrutura do Banco de Dados

### Model `Ensaio`

```prisma
model Ensaio {
  id               String          @id @default(cuid())
  title            String
  slug             String          @unique
  description      String?
  shootDate        DateTime?
  status           EnsaioStatus    @default(PUBLISHED)
  createdById      String
  subjectCpf       String
  coverImageKey    String?         // StorageKey da capa no R2
  termPdfKey       String?         // StorageKey do termo PDF no R2
  d4signDocumentId String?         // URL do documento D4Sign
  syncFolderUrl    String?         // Link do Sync.com (protegido)
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  deletedAt        DateTime?       // Soft delete
  photos           EnsaioPhoto[]   // Relação 1:N com fotos
  // ...
}
```

### Model `EnsaioPhoto`

```prisma
model EnsaioPhoto {
  id         String    @id @default(cuid())
  ensaioId   String
  storageKey String    // StorageKey da foto no R2
  sortOrder  Int       @default(0)  // Ordem de exibição
  createdAt  DateTime  @default(now())
  deletedAt  DateTime? // Soft delete
  ensaio     Ensaio    @relation(fields: [ensaioId], references: [id])
}
```

**Campos importantes:**
- `coverImageKey`: Chave R2 da foto de capa (ex: `ensaio-123/cover-1234567890.jpg`)
- `EnsaioPhoto.storageKey`: Chave R2 de cada foto da galeria (ex: `ensaio-123/photo-1234567890.jpg`)
- `sortOrder`: Ordem de exibição das fotos (0 = primeira)

---

## 🔐 Matriz de Permissões

### ARQUITETO
- ✅ **Criar/Editar/Excluir** ensaios
- ✅ **Upload de capa** (1 foto por ensaio)
- ✅ **Upload de galeria** (até 30 fotos por ensaio)
- ✅ **Definir capa** a partir de uma foto da galeria
- ✅ **Excluir fotos** individuais
- ✅ **Reordenar fotos** (via `sortOrder`)
- ✅ **Visualizar** todos os ensaios (próprios e de outros)

### ADMIN
- ❌ **NÃO pode criar/editar/excluir** ensaios
- ❌ **NÃO pode fazer upload** de capa ou fotos
- ✅ **Visualizar** todos os ensaios (somente leitura)
- ✅ **Acessar** página `/admin/ensaios` (lista somente leitura)
- ✅ **Acessar** página `/admin/ensaios/[id]` (detalhes somente leitura)

### MODELO
- ❌ **NÃO pode criar/editar/excluir** ensaios
- ❌ **NÃO pode fazer upload** de capa ou fotos
- ✅ **Visualizar** apenas seus próprios ensaios **PUBLISHED**
- ✅ **Acessar** página `/modelo/ensaios` (lista de ensaios próprios)
- ✅ **Acessar** página `/modelo/ensaios/[id]` (detalhes do próprio ensaio)
- ✅ **Visualizar** capa e galeria via URLs assinadas
- ✅ **Acessar** link seguro do Sync.com (via `/ensaios/[id]/sync-preview`)

### CLIENTE
- ❌ **NÃO pode criar/editar/excluir** ensaios
- ❌ **NÃO pode fazer upload** de capa ou fotos
- ✅ **Visualizar** apenas ensaios associados ao seu CPF (se implementado)

---

## 📤 Fluxo de Upload

### 1. Upload de Capa

**Rota:** `POST /api/ensaios/upload`

**Body (FormData):**
- `file`: File (JPG, PNG, WebP, até 40 MB)
- `type`: `"cover"`
- `ensaioId`: string (opcional, se já existir o ensaio)

**Resposta:**
```json
{
  "key": "ensaio-123/cover-1234567890.jpg",
  "size": 1024000,
  "type": "image/jpeg"
}
```

**Fluxo:**
1. ARQUITETO seleciona arquivo no formulário
2. Frontend faz upload via `FormData` para `/api/ensaios/upload`
3. Backend valida permissão (apenas ARQUITETO)
4. Backend faz upload para R2, retorna `storageKey`
5. Frontend salva `storageKey` no campo `coverImageKey` do ensaio
6. Ao salvar o ensaio, `coverImageKey` é persistido no banco

**Visualização:**
- ARQUITETO: Via componente `EnsaioCoverClient` (busca URL assinada)
- MODELO: Via componente `EnsaioCoverClient` (busca URL assinada)
- ADMIN: Via componente `EnsaioCoverClient` (busca URL assinada)

### 2. Upload de Galeria (Múltiplas Fotos)

**Rota:** `POST /api/ensaios/upload` (upload do arquivo)  
**Rota:** `POST /api/arquiteto/ensaios/[id]/photos` (adicionar foto ao ensaio)

**Fluxo:**
1. ARQUITETO seleciona múltiplas fotos (até 30 por ensaio)
2. Para cada foto:
   - Upload para R2 via `/api/ensaios/upload` (retorna `storageKey`)
   - Adicionar foto ao ensaio via `/api/arquiteto/ensaios/[id]/photos` (cria registro `EnsaioPhoto`)
3. Backend valida:
   - Permissão (apenas ARQUITETO)
   - Limite de 30 fotos por ensaio
   - Tamanho máximo: 3 MB por foto (40 MB em dev)
4. Fotos são salvas com `sortOrder` incremental

**Componente:** `EnsaioPhotosUpload`
- Upload múltiplo (até 30 fotos)
- Preview antes do upload
- Indicador de progresso
- Botão "Capa" para definir capa a partir de uma foto
- Botão "Excluir" para remover fotos

---

## 📥 Fluxo de Visualização

### 1. Capa do Ensaio

**Rota:** `GET /api/ensaios/[id]/cover`

**Permissões:**
- ARQUITETO: Pode ver capa de seus próprios ensaios
- ADMIN: Pode ver capa de todos os ensaios
- MODELO: Pode ver capa apenas de seus próprios ensaios PUBLICADOS

**Resposta:**
```json
{
  "signedUrl": "https://r2.example.com/ensaio-123/cover.jpg?signature=..."
}
```

**Componente:** `EnsaioCoverClient`
- Busca URL assinada via API
- Exibe placeholder "Sem capa" se não houver
- Expiração: 120 segundos

### 2. Galeria do Ensaio

**Rota:** `GET /api/ensaios/[id]/photos`

**Permissões:**
- ARQUITETO: Pode ver fotos de seus próprios ensaios
- ADMIN: Pode ver fotos de todos os ensaios
- MODELO: Pode ver fotos apenas de seus próprios ensaios PUBLICADOS

**Resposta:**
```json
{
  "photos": [
    {
      "id": "photo-123",
      "sortOrder": 0,
      "signedUrl": "https://r2.example.com/ensaio-123/photo-1.jpg?signature=...",
      "createdAt": "2025-01-27T10:00:00Z"
    },
    // ...
  ]
}
```

**Componente:** `EnsaioPhotosClient`
- Busca lista de fotos via API
- Exibe em `MasonryGrid` (layout premium)
- Integra com `Lightbox` para visualização full-screen
- Expiração: 120 segundos por URL

---

## 🎨 Componentes de UI

### `EnsaioCoverClient`
- **Localização:** `src/app/arquiteto/ensaios/components/EnsaioCoverClient.tsx`
- **Uso:** Miniaturas em listagens e capa em detalhes
- **Props:** `ensaioId`, `title`
- **Comportamento:** Busca URL assinada, exibe placeholder se não houver

### `EnsaioPhotosClient`
- **Localização:** `src/app/modelo/ensaios/[id]/components/EnsaioPhotosClient.tsx`
- **Uso:** Galeria de fotos na página de detalhes
- **Props:** `ensaioId`
- **Comportamento:** Busca lista de fotos, exibe em `MasonryGrid` com `Lightbox`

### `EnsaioPhotosUpload`
- **Localização:** `src/app/arquiteto/ensaios/[id]/edit/components/EnsaioPhotosUpload.tsx`
- **Uso:** Upload e gestão de fotos (apenas ARQUITETO)
- **Props:** `ensaioId`, `existingPhotos`, `onPhotosChange`
- **Funcionalidades:**
  - Upload múltiplo (até 30 fotos)
  - Preview antes do upload
  - Indicador de progresso
  - Definir capa
  - Excluir fotos

### `MasonryGrid`
- **Localização:** `src/components/galleries/MasonryGrid.tsx`
- **Uso:** Layout premium para galerias
- **Props:** `photos`, `columns`, `gap`
- **Comportamento:** Grid responsivo (3 colunas desktop, 2 tablet, 1 mobile)

### `Lightbox`
- **Localização:** `src/components/galleries/Lightbox.tsx`
- **Uso:** Visualização full-screen de imagens
- **Props:** `isOpen`, `image`, `onClose`, `onNext`, `onPrevious`
- **Funcionalidades:** Zoom, navegação (setas, teclado), contador

---

## 🔗 Rotas de API

### Upload
- `POST /api/ensaios/upload` - Upload de arquivo (capa, termo, foto)
- `POST /api/arquiteto/ensaios/[id]/photos` - Adicionar foto ao ensaio
- `DELETE /api/arquiteto/ensaios/[id]/photos/[photoId]` - Remover foto

### Visualização
- `GET /api/ensaios/[id]/cover` - URL assinada da capa
- `GET /api/ensaios/[id]/photos` - Lista de fotos com URLs assinadas
- `GET /api/ensaios/[id]/photos/[photoId]/url` - URL assinada de uma foto específica

### Segurança
- Todas as rotas validam autenticação via `auth()`
- URLs assinadas têm expiração curta (60-120s)
- `storageKey` nunca é exposto diretamente ao cliente

---

## 📱 Páginas por Perfil

### ARQUITETO
- `/arquiteto/ensaios` - Lista de ensaios (com filtros)
- `/arquiteto/ensaios/new` - Criar novo ensaio
- `/arquiteto/ensaios/[id]` - Detalhes do ensaio
- `/arquiteto/ensaios/[id]/edit` - Editar ensaio (upload de capa e galeria)

### ADMIN
- `/admin/ensaios` - Lista de ensaios (somente leitura)
- `/admin/ensaios/[id]` - Detalhes do ensaio (somente leitura)

### MODELO
- `/modelo/ensaios` - Lista de ensaios próprios PUBLICADOS
- `/modelo/ensaios/[id]` - Detalhes do próprio ensaio
- `/ensaios/[id]/sync-preview` - Visualização protegida do Sync.com

---

## ✅ Funcionalidades Implementadas

### Upload
- ✅ Upload de capa (1 foto por ensaio)
- ✅ Upload múltiplo de galeria (até 30 fotos)
- ✅ Preview antes do upload
- ✅ Indicador de progresso
- ✅ Validação de tipo e tamanho
- ✅ Mensagens de sucesso/erro

### Gestão
- ✅ Definir capa a partir de uma foto da galeria
- ✅ Excluir fotos individuais (soft delete)
- ✅ Reordenar fotos (via `sortOrder`)
- ✅ Limite de 30 fotos por ensaio

### Visualização
- ✅ Capa em listagens (cards)
- ✅ Capa em detalhes (destaque)
- ✅ Galeria com MasonryGrid
- ✅ Lightbox para visualização full-screen
- ✅ Placeholders quando não há imagens

### Segurança
- ✅ URLs assinadas com expiração curta
- ✅ Validação de permissões por perfil
- ✅ `storageKey` nunca exposto diretamente
- ✅ Links do Sync.com protegidos (iframe sandbox)

---

## 🐛 Problemas Corrigidos

### BLOCO 1: Upload de Capa e Galeria
- ✅ Upload múltiplo funcionando (não substitui fotos anteriores)
- ✅ Capa e galeria aparecem corretamente
- ✅ URLs assinadas geradas corretamente
- ✅ Placeholders quando não há imagens

### BLOCO 2: Avatar / Foto de Perfil
- ✅ ARQUITETO pode fazer upload de foto para qualquer usuário
- ✅ Preview atualizado após upload
- ✅ Avatar aparece corretamente em listagens
- ✅ URLs assinadas geradas corretamente

### BLOCO 3: Comportamento por ROLE
- ✅ ADMIN tem página de ensaios somente leitura (`/admin/ensaios`)
- ✅ MODELO vê apenas seus próprios ensaios PUBLICADOS
- ✅ Botão "Ver ensaio completo" funciona corretamente
- ✅ Mensagens informativas adequadas

### BLOCO 4: UX do Fluxo de Ensaios
- ✅ Mensagens de sucesso/erro no upload
- ✅ Estados visuais claros (sem capa, sem fotos)
- ✅ Design premium aplicado consistentemente
- ✅ Integração com MasonryGrid e Lightbox

---

## 🧪 Testes Recomendados

### ARQUITETO
1. ✅ Criar novo ensaio para MODELO
2. ✅ Fazer upload de capa
3. ✅ Fazer upload de 3-5 fotos na galeria
4. ✅ Ver capa e galeria na página de detalhes
5. ✅ Definir capa a partir de uma foto da galeria
6. ✅ Excluir foto individual
7. ✅ Editar ensaio e ver capa/galeria persistidas

### MODELO
1. ✅ Logar e acessar "Meus Ensaios"
2. ✅ Ver ensaio criado com capa e galeria
3. ✅ Abrir lightbox e navegar entre fotos
4. ✅ Clicar em "Ver ensaio completo em alta resolução"
5. ✅ Verificar que link do Sync.com abre em iframe protegido

### ADMIN
1. ✅ Logar e acessar "Ensaios"
2. ✅ Ver lista de ensaios (somente leitura)
3. ✅ Acessar detalhes de um ensaio
4. ✅ Verificar que não há botões de criação/edição
5. ✅ Verificar que capa e galeria aparecem corretamente

---

## 📝 Notas Técnicas

### Storage Keys
- Formato: `ensaio-{ensaioId}/{type}-{timestamp}.{ext}`
- Exemplo: `ensaio-abc123/cover-1234567890.jpg`
- Exemplo: `ensaio-abc123/photo-1234567891.jpg`

### URLs Assinadas
- Expiração: 60-120 segundos
- Geração: Via `getSignedUrlForKey()` do R2
- Uso: Apenas para visualização temporária

### Soft Delete
- Fotos deletadas: `deletedAt` preenchido
- Ensaios deletados: `deletedAt` preenchido
- Queries: Sempre filtram `deletedAt: null`

### Ordenação
- Fotos: `orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]`
- Ensaios: `orderBy: [{ shootDate: "desc" }, { createdAt: "desc" }]`

---

## 🚀 Próximos Passos (V3)

- [ ] Login por token mágico
- [ ] Notificações em tempo real
- [ ] Compartilhamento seguro de ensaios
- [ ] Histórico de alterações
- [ ] Exportação de relatórios

---

**Status Final:** ✅ V2 Estabilizado e Pronto para Produção

