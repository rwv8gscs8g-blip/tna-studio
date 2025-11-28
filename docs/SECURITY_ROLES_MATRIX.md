# Matriz de Segurança - TNA-Studio V2

## Regra Absoluta

**ADMIN É ESTRITAMENTE SOMENTE LEITURA**

- ✅ ADMIN pode ver tudo (GET)
- ❌ ADMIN NÃO pode criar, editar, excluir ou fazer upload (POST, PUT, PATCH, DELETE)

## Matriz de Permissões por Role

| Operação | ARQUITETO | ADMIN | MODELO | CLIENTE |
|----------|-----------|-------|---------|---------|
| **Leitura (GET)** | | | | |
| Ver usuários | ✅ Todos | ✅ Todos | ❌ | ❌ |
| Ver ensaios | ✅ Todos | ✅ Todos | ✅ Próprios | ✅ Próprios |
| Ver produtos | ✅ Todos | ✅ Todos | ✅ Todos | ✅ Todos |
| Ver projetos | ✅ Todos | ✅ Todos | ✅ Todos | ✅ Todos |
| Ver fotos | ✅ Todas | ✅ Todas | ✅ Próprias | ✅ Próprias |
| **Escrita (POST/PUT/PATCH/DELETE)** | | | | |
| Criar usuário | ✅ | ❌ | ❌ | ❌ |
| Editar usuário | ✅ | ❌ | ❌ | ❌ |
| Excluir usuário | ✅ | ❌ | ❌ | ❌ |
| Criar ensaio | ✅ | ❌ | ❌ | ❌ |
| Editar ensaio | ✅ | ❌ | ❌ | ❌ |
| Excluir ensaio | ✅ | ❌ | ❌ | ❌ |
| Criar produto | ✅ | ❌ | ❌ | ❌ |
| Editar produto | ✅ | ❌ | ❌ | ❌ |
| Excluir produto | ✅ | ❌ | ❌ | ❌ |
| Criar projeto | ✅ | ❌ | ❌ | ❌ |
| Editar projeto | ✅ | ❌ | ❌ | ❌ |
| Excluir projeto | ✅ | ❌ | ❌ | ❌ |
| Upload de foto | ✅ | ❌ | ❌ | ❌ |
| Upload de PDF | ✅ | ❌ | ❌ | ❌ |
| Upload de perfil | ✅ (todos) / ✅ (próprio) | ❌ | ✅ (próprio) | ✅ (próprio) |

## Rotas de API - Auditoria de Segurança

### ✅ Rotas Protegidas Corretamente

#### Usuários
- `POST /api/admin/users` - ✅ Bloqueia ADMIN (apenas ARQUITETO)
- `PATCH /api/admin/users/[id]` - ✅ Bloqueia ADMIN (apenas ARQUITETO)
- `DELETE /api/admin/users/[id]` - ✅ Bloqueia ADMIN (apenas ARQUITETO)
- `POST /api/admin/users/upload-profile-image` - ✅ Permite ARQUITETO ou próprio usuário

#### Produtos
- `POST /api/produtos` - ✅ Bloqueia ADMIN (apenas ARQUITETO)
- `PATCH /api/produtos/[id]` - ✅ Bloqueia ADMIN (apenas ARQUITETO)
- `DELETE /api/produtos/[id]` - ✅ Bloqueia ADMIN (apenas ARQUITETO)
- `POST /api/produtos/upload-photo` - ✅ Bloqueia ADMIN (apenas ARQUITETO)
- `DELETE /api/produtos/[id]/photo/[photoId]` - ✅ Bloqueia ADMIN (apenas ARQUITETO)

#### Ensaios
- `POST /api/arquiteto/ensaios` - ✅ Bloqueia ADMIN (apenas ARQUITETO)
- `PATCH /api/arquiteto/ensaios/[id]` - ✅ Bloqueia ADMIN (apenas ARQUITETO)
- `POST /api/ensaios/upload` - ✅ Bloqueia ADMIN (apenas ARQUITETO)
- `POST /api/arquiteto/ensaios/[id]/photos` - ✅ Bloqueia ADMIN (apenas ARQUITETO)
- `PUT /api/arquiteto/ensaios/[id]/photos` - ✅ Bloqueia ADMIN (apenas ARQUITETO)
- `DELETE /api/arquiteto/ensaios/[id]/photos/[photoId]` - ✅ Bloqueia ADMIN (apenas ARQUITETO)

#### Projetos
- `POST /api/projetos` - ✅ Bloqueia ADMIN (apenas ARQUITETO)
- `PATCH /api/projetos/[id]` - ✅ Bloqueia ADMIN (apenas ARQUITETO)
- `DELETE /api/projetos/[id]` - ✅ Bloqueia ADMIN (apenas ARQUITETO)

#### Galerias
- `POST /api/galleries` - ✅ Bloqueia ADMIN (apenas ARQUITETO via canWriteOperation)
- `PATCH /api/galleries/[id]` - ✅ Bloqueia ADMIN (apenas ARQUITETO via canWriteOperation)
- `DELETE /api/galleries/[id]` - ✅ Bloqueia ADMIN (apenas ARQUITETO via canWriteOperation)

#### Perfil
- `PATCH /api/profile/update` - ✅ Permite ARQUITETO (todos) ou próprio usuário

### ⚠️ Rotas de Leitura (GET) - Permitidas para ADMIN

Estas rotas permitem ADMIN porque são apenas leitura:

- `GET /api/admin/users` - ✅ ADMIN pode ver
- `GET /api/admin/users/[id]` - ✅ ADMIN pode ver
- `GET /api/admin/reports` - ✅ ADMIN pode ver
- `GET /api/ensaios/[id]/cover` - ✅ ADMIN pode ver
- `GET /api/ensaios/[id]/photos` - ✅ ADMIN pode ver
- `GET /api/ensaios/[id]/term` - ✅ ADMIN pode ver
- `GET /api/ensaios/[id]/sync-link` - ✅ ADMIN pode ver (somente leitura)
- `GET /api/produtos` - ✅ ADMIN pode ver
- `GET /api/projetos` - ✅ ADMIN pode ver
- `GET /api/galleries` - ✅ ADMIN pode ver
- `GET /api/galleries/[id]` - ✅ ADMIN pode ver

## Helpers de Segurança

### `src/lib/security.ts`

```typescript
// Verifica se operação de escrita pode ser executada
validateWriteOperation(userRole: Role | string | undefined): NextResponse | null

// Retorna null se permitido, ou NextResponse com erro se bloqueado
// Bloqueia explicitamente ADMIN
```

### `src/lib/write-guard-arquiteto.ts`

```typescript
// Verifica se operação de escrita pode ser executada (apenas ARQUITETO)
canWriteOperation(
  userId: string,
  userRole: Role,
  operationType: string,
  operationId: string,
  payload: any,
  ip: string,
  userAgent: string,
  sessionId?: string
): Promise<WriteGuardResult>

// Bloqueia todos os roles exceto ARQUITETO
```

## UI - Esconder Botões de Ação para ADMIN

### Páginas que devem esconder botões para ADMIN:

1. **`/admin/users`** - ✅ Já implementado (`canEdit` flag)
2. **`/arquiteto/produtos`** - ⚠️ Verificar se esconde para ADMIN
3. **`/arquiteto/ensaios`** - ⚠️ Verificar se esconde para ADMIN
4. **`/arquiteto/projetos`** - ⚠️ Verificar se esconde para ADMIN

### Componentes que devem verificar role:

- `CreateUserForm` - ✅ Já verifica `canEdit`
- `EditUserModal` - ✅ Já verifica `canEdit`
- `ProdutosListClient` - ⚠️ Verificar
- `EnsaiosListClient` - ⚠️ Verificar
- `CreateEnsaioForm` - ⚠️ Verificar

## Checklist de Validação

- [x] Todas as rotas POST bloqueiam ADMIN
- [x] Todas as rotas PUT/PATCH bloqueiam ADMIN
- [x] Todas as rotas DELETE bloqueiam ADMIN
- [x] Todas as rotas de upload bloqueiam ADMIN
- [ ] UI esconde botões de ação para ADMIN
- [ ] Documentação atualizada
- [ ] Testes manuais realizados

## Data da Auditoria

**Data:** 2025-01-27
**Versão:** TNA-Studio V2
**Status:** ✅ Backend protegido | ⚠️ UI em revisão
