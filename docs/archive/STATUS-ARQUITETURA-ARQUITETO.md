# Status da Arquitetura ARQUITETO

**Data:** 2025-11-21  
**Versão:** 1.0

## Roles Existentes

O sistema possui os seguintes roles (enum `Role`):
- `ARQUITETO` - Único perfil com direitos de escrita
- `ADMIN` - Somente leitura ampla (pode ver tudo, não pode editar)
- `SUPER_ADMIN` - Somente leitura ampla (pode gerenciar certificado A1)
- `MODEL` - Somente leitura dos próprios dados
- `CLIENT` - Somente leitura dos próprios dados

## ArquitetoSession

**Status:** ✅ Implementada

A `ArquitetoSession` substitui completamente a `AdminSession` antiga.

**Funcionalidades:**
- Garante que apenas UM Arquiteto pode estar logado por vez (em qualquer ambiente)
- Ao logar um segundo Arquiteto, a sessão anterior é encerrada imediatamente
- Rastreia ambiente (`production` ou `localhost`)
- Se há sessão ativa em um ambiente, o outro fica em modo read-only

**Implementação:**
- Tabela `ArquitetoSession` no schema Prisma
- Biblioteca `src/lib/arquiteto-session.ts` com funções:
  - `registerArquitetoSession()` - Registra nova sessão (remove anteriores)
  - `canArquitetoWrite()` - Verifica se pode escrever
  - `removeArquitetoSession()` - Remove sessão (logout)
  - `cleanupExpiredArquitetoSessions()` - Limpa sessões expiradas
  - `hasActiveArquitetoSession()` - Verifica se existe sessão ativa
  - `getActiveArquitetoSession()` - Obtém sessão ativa

## Rotas de API que Usam write-guard-arquiteto

### ✅ Já Atualizadas:
- `/api/admin/users` (POST) - Criação de usuários
- `/api/admin/users/[id]` (PATCH, DELETE) - Edição/exclusão de usuários
- `/api/galleries` (POST) - Criação de galerias
- `/api/galleries/[id]` (PATCH, DELETE) - Edição/exclusão de galerias

### ⚠️ Pendentes de Atualização:
- `/api/media/upload` (POST) - Upload de fotos
- `/api/profile/update` (PATCH) - Atualização de perfil
- `/api/super-admin/certificates/upload` (POST) - Upload de certificado (apenas SUPER_ADMIN)
- Outras rotas de escrita não identificadas ainda

## Fluxo de Login

**Status:** ⚠️ Parcialmente implementado

### Provider Credentials (email + senha):
- ✅ Funciona para todos os roles
- ✅ Para ARQUITETO: registra `ArquitetoSession` (1 hora)
- ⚠️ Para outros roles: não registra sessão especial

### Provider Certificate (certificado digital A1):
- ✅ Implementado em `src/lib/certificate-login.ts`
- ✅ Apenas para ARQUITETO
- ✅ Valida certificado A1 do servidor (`secrets/certs/assinatura_a1.pfx`)
- ⚠️ Falta interface de login no frontend (`/signin`)
- ⚠️ Falta tratamento de erro claro quando certificado inválido

## Problemas Identificados

### ✅ Resolvidos:
1. **Referências ao AdminSession:**
   - ✅ `src/auth.ts` - importação removida
   - ✅ `src/app/api/auth/logout/route.ts` - atualizado para usar `removeArquitetoSession`
   - ⚠️ `src/lib/admin-session.ts` ainda existe (mantido para compatibilidade, mas não é mais usado)

2. **Upload de fotos:**
   - ✅ `/api/media/upload` - agora usa `write-guard-arquiteto`

3. **Seed:**
   - ✅ Senha atualizada para `[redacted-password]`
   - ✅ Cria apenas primeiro ARQUITETO

4. **Migration:**
   - ✅ Migration `20251121201322_add_arquiteto_role_and_session` criada
   - ⚠️ Migration ainda não aplicada no banco (deve ser aplicada antes de usar)

5. **Documentação:**
   - ✅ `STATUS-ARQUITETURA-ARQUITETO.md` criado
   - ✅ `ARQUITETURA-ARQUITETO.md` criado
   - ✅ `SEGURANCA-A1.md` criado
   - ✅ `CHECKLIST-MVP-ARQUITETO.md` criado
   - ✅ `RESUMO-MVP-ARQUITETO.md` criado
   - ✅ `INSTRUCOES-SETUP.md` criado

### ⚠️ Pendentes:
1. **Migration não aplicada:**
   - Migration `20251121201322_add_arquiteto_role_and_session` deve ser aplicada no banco antes de usar
   - Execute: `npx prisma migrate deploy` ou `npx prisma migrate dev`

2. **Prisma Client:**
   - ✅ Prisma Client regenerado
   - ⚠️ Se houver erros de TypeScript sobre `Role.ARQUITETO`, reinicie o servidor TypeScript

3. **Interface de login por certificado:**
   - Falta interface no frontend para login por certificado A1
   - Login por certificado funciona via API, mas não tem UI

## Progresso das Fases

1. ✅ FASE 0: Diagnóstico completo
2. ✅ FASE 1: Limpar referências ao AdminSession, migration criada
3. ✅ FASE 2: Autenticação corrigida (credentials + A1)
4. ✅ FASE 3: Write-guard aplicado nas principais rotas de escrita
5. ✅ FASE 4: Middleware ajustado (já estava ok)
6. ✅ FASE 5: Seed consolidado e script de reset criado
7. ✅ FASE 6: Documentação criada
8. ✅ FASE 7: Checklist criado

## Próximo Passo Crítico

**Aplicar migration no banco de dados:**
```bash
npx prisma migrate deploy
# OU em desenvolvimento:
npx prisma migrate dev
```

Após aplicar a migration, o sistema estará pronto para testes!

