# Documento de Validação MVP - TNA Studio

## Correções Aplicadas (Versão Atual)

### 1. Correção do Enum EnsaioStatus.DELETED

**Problema:** Erro `Invalid prisma.ensaio.count() invocation: invalid input value for enum "EnsaioStatus": "DELETED"` ao acessar rotas como `/arquiteto/relatorios`, `/arquiteto/ensaios` e `/avisos`.

**Solução:**
- Importado `EnsaioStatus` do `@prisma/client` em todos os arquivos que usam status de ensaio
- Substituído uso de strings `"DELETED"`, `"PUBLISHED"`, `"DRAFT"` pelo enum `EnsaioStatus.DELETED`, `EnsaioStatus.PUBLISHED`, `EnsaioStatus.DRAFT`
- Arquivos corrigidos:
  - `src/app/arquiteto/relatorios/page.tsx`
  - `src/app/avisos/page.tsx`
  - `src/app/arquiteto/ensaios/page.tsx`
  - `src/app/api/arquiteto/ensaios/limpar-deletados/route.ts`
  - `src/app/api/arquiteto/ensaios/[id]/route.ts`
  - `src/app/modelo/ensaios/page.tsx`
  - `src/app/modelo/contratos/page.tsx`

**Migration necessária:**
- A migration `20250124000000_add_deleted_status_to_ensaio` já existe e adiciona o valor `DELETED` ao enum
- Para aplicar em desenvolvimento: `npx prisma migrate dev`
- Para aplicar em produção (Neon): `npx prisma migrate deploy`

### 2. Correção do Redirecionamento do ARQUITETO

**Problema:** Login do ARQUITETO não funcionava corretamente.

**Solução:**
- Verificado redirecionamento em `src/app/page.tsx` e `src/app/components/LoginFlowV2.tsx`
- ARQUITETO agora redireciona corretamente para `/arquiteto/relatorios`
- Regras de redirecionamento confirmadas:
  - ARQUITETO → `/arquiteto/relatorios`
  - ADMIN → `/admin/relatorios`
  - MODELO → `/modelo/home`
  - CLIENTE → `/modelo/home`
  - SUPERADMIN → `/super-admin/certificates`

### 3. Remoção de Menus Duplicados para ADMIN

**Problema:** ADMIN via menus duplicados na navegação.

**Solução:**
- Simplificada navegação do ADMIN em `src/app/components/Navigation.tsx`
- ADMIN agora vê apenas:
  - Relatórios (`/admin/relatorios`)
  - Avisos (`/avisos`)
  - Perfil
  - Sair
- Removidos links duplicados que estavam dentro de `canSeeAdmin`

### 4. Estados Vazios nas Páginas

**Solução:**
- Página `/avisos` já possui estado vazio amigável: "Nenhum aviso no momento. Tudo está em ordem! ✅"
- Página `/arquiteto/ensaios` já possui estado vazio no componente `EnsaiosListClient`: "Nenhum ensaio encontrado."

### 5. Fluxo de Solicitação de Alteração de Dados

**Solução:**
- Página `/modelo/solicitar-alteracao` já existe e está funcional
- Adicionado botão "📝 Solicitar Atualização de Dados" na página de perfil (`src/app/profile/ProfileFormComplete.tsx`)
- Mensagem atualizada: "Seus dados pessoais foram cadastrados e só podem ser atualizados pelo responsável pelo sistema. Você pode solicitar uma atualização e ela será aplicada após revisão."

### 6. Login do CLIENTE

**Verificação:**
- Seed do CLIENTE está correto em `prisma/seed.ts`:
  - Email: `cliente@tna.studio`
  - Senha: `Cliente@2025!`
  - Role: `Role.CLIENTE`
- Redirecionamento configurado para `/modelo/home` (mesma interface da MODELO)

### 7. Substituição de Mensagens

**Solução:**
- Substituídas referências a "Arquiteto" por "responsável pelo sistema" em mensagens de permissão
- Arquivo `src/app/profile/ProfileFormComplete.tsx` atualizado

## Checklist de Testes em Localhost

### Testes de Login
- [ ] Login como ARQUITETO → deve redirecionar para `/arquiteto/relatorios`
- [ ] Login como ADMIN → deve redirecionar para `/admin/relatorios`
- [ ] Login como MODELO → deve redirecionar para `/modelo/home`
- [ ] Login como CLIENTE → deve redirecionar para `/modelo/home`
- [ ] Login como SUPERADMIN → deve redirecionar para `/super-admin/certificates`

### Testes de Páginas
- [ ] Acessar `/arquiteto/relatorios` → deve carregar sem erro de enum
- [ ] Acessar `/arquiteto/ensaios` → deve carregar sem erro de enum
- [ ] Acessar `/avisos` → deve carregar sem erro de enum
- [ ] Acessar `/arquiteto/ensaios` sem ensaios → deve mostrar "Nenhum ensaio encontrado"
- [ ] Acessar `/avisos` sem avisos → deve mostrar "Nenhum aviso no momento"

### Testes de Navegação
- [ ] ADMIN deve ver apenas: Relatórios, Avisos, Perfil, Sair (sem duplicação)
- [ ] ARQUITETO deve ver: Relatórios, Ensaios, Criar Ensaio, Loja, Projetos, Avisos, Perfil, Sair
- [ ] MODELO deve ver: Home, Meus Ensaios, Loja, Projetos, Perfil, Sair

### Testes de Solicitação de Alteração
- [ ] MODELO/CLIENTE acessa `/profile` → deve ver botão "Solicitar Atualização de Dados"
- [ ] Clicar no botão → deve abrir `/modelo/solicitar-alteracao`
- [ ] Criar solicitação → deve aparecer na página `/arquiteto/solicitacoes` para ARQUITETO aprovar

### Testes de Permissões
- [ ] ADMIN não pode criar/editar ensaios (somente leitura)
- [ ] ARQUITETO pode criar/editar ensaios
- [ ] MODELO/CLIENTE não pode criar ensaios
- [ ] Mensagens de erro devem mencionar "responsável pelo sistema" e não "Arquiteto"

## Comandos para Aplicar Migrations

### Desenvolvimento
```bash
npx prisma migrate dev
npx prisma generate
```

### Produção (Neon)
```bash
npx prisma migrate deploy
npx prisma generate
```

## Observações Importantes

1. **Enum EnsaioStatus:** Sempre usar `EnsaioStatus.DELETED`, `EnsaioStatus.PUBLISHED`, `EnsaioStatus.DRAFT` em vez de strings
2. **Redirecionamento:** Regras definitivas implementadas em `src/app/page.tsx` e `src/app/components/LoginFlowV2.tsx`
3. **Navegação:** ADMIN tem menu simplificado (somente leitura)
4. **Solicitações:** MODELO/CLIENTE podem solicitar alterações via `/modelo/solicitar-alteracao`
5. **Mensagens:** Todas as mensagens de permissão devem mencionar "responsável pelo sistema"

## Erros e Correções (Atualização)

### Correção do Enum EnsaioStatus.DELETED no Postgres

**Problema:** Erro `Invalid prisma.ensaio.count() invocation. Error: invalid input value for enum "EnsaioStatus": "DELETED"` ao acessar `/arquiteto/relatorios`, `/arquiteto/ensaios` e `/avisos`.

**Solução:**
- Criada migration idempotente `20250125000000_ensure_deleted_in_ensaio_status` que adiciona o valor `DELETED` ao enum `EnsaioStatus` no Postgres usando `DO $$ BEGIN ... EXCEPTION ... END $$;` para garantir que não quebra se o valor já existir
- Migration aplicável tanto em desenvolvimento quanto em produção (banco único Neon)

**Comando para aplicar:**
```bash
npx prisma migrate deploy  # Para produção
# ou
npx prisma migrate dev     # Para desenvolvimento
```

### Tratamento de Erro nas Páginas de Relatórios/Ensaios/Avisos

**Problema:** Páginas quebravam com erro 500 quando havia problemas de conexão ou enum, deixando usuário "preso".

**Solução:**
- Adicionado `try/catch` em todas as queries Prisma nas páginas:
  - `src/app/arquiteto/relatorios/page.tsx`
  - `src/app/arquiteto/ensaios/page.tsx`
  - `src/app/avisos/page.tsx`
- Em caso de erro, páginas mostram mensagem amigável: "Não foi possível carregar os dados neste momento. Tente novamente em alguns instantes ou contate o responsável pelo sistema."
- Adicionados links de navegação ("Voltar para Relatórios") mesmo em estado de erro
- Navegação superior sempre visível e funcional

### Ajustes na Navegação "Criar Ensaio" para o ARQUITETO

**Problema:** ARQUITETO logado ao clicar em "Criar Ensaio" via página de cadastro genérica.

**Solução:**
- Verificado que a rota `/arquiteto/ensaios/new` já existe e está correta
- Adicionada verificação na página `/signup` para redirecionar ARQUITETO logado para `/arquiteto/relatorios`
- Mensagem específica para ARQUITETO: "Você já está logado como responsável pelo sistema. O cadastro de novos usuários é feito a partir da área administrativa."
- Link "Criar Ensaio" na navegação já aponta corretamente para `/arquiteto/ensaios/new`

### Ajustes de Mensagens (Responsável pelo Sistema)

**Arquivos corrigidos:**
- `src/app/signup/page.tsx`: "pelo Arquiteto responsável" → "pelo responsável pelo sistema"
- `src/app/modelo/profile/page.tsx`: "pelo Arquiteto responsável pelo ensaio" → "pelo responsável pelo sistema" + adicionado botão "Solicitar Atualização de Dados"
- `src/app/api/profile/update/route.ts`: Comentário atualizado

**Mensagens padronizadas:**
- Todas as mensagens de permissão agora mencionam "responsável pelo sistema" em vez de "Arquiteto"
- Mantida consistência em toda a aplicação
