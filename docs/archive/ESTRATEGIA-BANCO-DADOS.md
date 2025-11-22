# Estratégia de Banco de Dados Compartilhado

## 🎯 Objetivo

Permitir que localhost e produção compartilhem o mesmo banco de dados PostgreSQL (Neon), com proteção contra uso simultâneo de funções administrativas.

## 🔐 Proteção de Admin Duplo

### Como Funciona

1. **Modelo AdminSession**: Rastreia sessões ativas de admin
   - Campo `environment`: "localhost" ou "production"
   - Campo `expiresAt`: Baseado na expiração do token JWT
   - Um admin por vez (constraint `userId @unique`)

2. **Registro no Login**:
   - Quando admin faz login, registra sessão no ambiente atual
   - Remove sessões antigas do mesmo admin

3. **Verificação Antes de Funções Admin**:
   - Antes de permitir funções administrativas, verifica `canAdminUseFunctions()`
   - Se há sessão ativa em outro ambiente, bloqueia
   - Se sessão expirou, remove e permite

4. **Remoção no Logout**:
   - Ao fazer logout, remove sessão de admin
   - Permite login em outro ambiente

### Implementação

**Arquivo**: `src/lib/admin-session.ts`

```typescript
// Verifica se pode usar funções admin
canAdminUseFunctions(userId, userRole)

// Registra sessão (login)
registerAdminSession(userId, ip, userAgent, expiresAt)

// Remove sessão (logout)
removeAdminSession(userId)
```

**Integração**:
- `src/auth.ts` - Registra sessão no login
- `src/app/api/auth/logout/route.ts` - Remove sessão no logout
- APIs admin - Verificam antes de permitir operações

## 📊 Isolamento por CPF

### Regras

1. **CPF Único**: Constraint `@unique` no campo `cpf` do User
2. **Passaporte Único**: Constraint `@unique` no campo `passport` do User
3. **CPF na Gallery**: Campo `ownerCpf` mantido mesmo se usuário for deletado
4. **Acesso por CPF**: Apenas usuário com mesmo CPF ou admin pode acessar

### Implementação

**Schema**:
- `User.cpf` - `@unique` (pode ser null)
- `User.passport` - `@unique` (pode ser null)
- `Gallery.ownerCpf` - Mantido mesmo se `userId` for null
- `Gallery.userId` - Opcional (SetNull ao deletar usuário)

**Validação**:
- `src/lib/gallery-access.ts` - Funções `canAccessGalleryByCpf()` e `canAccessPhotoByCpf()`

## 🔄 Fluxo de Dados

### Criação de Galeria

1. Admin cria galeria
2. Sistema salva `userId` e `ownerCpf` (do usuário dono)
3. Se usuário for deletado, `userId` vira null, mas `ownerCpf` permanece

### Acesso a Galeria

1. Usuário tenta acessar galeria
2. Sistema verifica:
   - Se é admin → permite
   - Se `userId` da galeria === `userId` do usuário → permite
   - Se `ownerCpf` da galeria === `cpf` do usuário → permite
   - Se `ownerPassport` da galeria === `passport` do usuário → permite
   - Caso contrário → nega

## ⚠️ Limitações

1. **Uma máquina de desenvolvimento**: Sistema assume que apenas uma máquina usa localhost
2. **Ambiente detectado automaticamente**: Baseado em `NODE_ENV === "production"`
3. **Sessões expiradas**: Limpeza automática ao verificar (não há cron job ainda)

## 🚀 Próximos Passos

1. ✅ Schema ajustado
2. ✅ Funções de validação criadas
3. ⏳ Integrar validação em APIs admin
4. ⏳ Criar migration do Prisma
5. ⏳ Testar bloqueio de admin duplo

---

**Status**: Implementação base completa
**Próximo**: Migration e testes

