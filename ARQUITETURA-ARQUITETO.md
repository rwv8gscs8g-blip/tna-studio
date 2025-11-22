# Arquitetura ARQUITETO - TNA Studio

**Versão:** 1.0  
**Data:** 2025-11-21

## Visão Geral

Esta arquitetura estabelece o **ARQUITETO** como o único perfil com direitos de escrita no sistema. Todos os outros perfis (ADMIN, SUPER_ADMIN, MODEL, CLIENT) têm acesso somente leitura conforme suas permissões.

## Roles e Permissões

### ARQUITETO
- **Escrita:** ✅ Total (com certificado digital A1)
- **Leitura:** ✅ Tudo
- **Funções:**
  - Criar, editar e excluir usuários
  - Criar, editar e excluir galerias
  - Fazer upload de fotos
  - Gerenciar todos os dados do sistema
- **Autenticação:** Login por email/senha ou certificado digital A1
- **Sessão:** ArquitetoSession (1 hora, única por vez)

### SUPER_ADMIN
- **Escrita:** ❌ Nenhuma (exceto gerenciar certificado A1)
- **Leitura:** ✅ Tudo
- **Função única:** Trocar o certificado digital A1 válido no sistema
- **Autenticação:** Login por email/senha

### ADMIN
- **Escrita:** ❌ Nenhuma
- **Leitura:** ✅ Tudo
- **Função:** Visualização ampla de todos os dados (somente leitura)
- **Autenticação:** Login por email/senha

### MODEL / CLIENT
- **Escrita:** ❌ Nenhuma
- **Leitura:** ✅ Apenas seus próprios dados
- **Função:** Visualizar e baixar apenas suas galerias e arquivos
- **Autenticação:** Login por email/senha

## ArquitetoSession

**Objetivo:** Garantir que apenas UM Arquiteto está logado por vez em qualquer ambiente.

### Funcionamento:
1. Ao logar um ARQUITETO, remove todas as sessões anteriores (em qualquer ambiente)
2. Rastreia o ambiente atual (`production` ou `localhost`)
3. Se há sessão ativa em um ambiente, o outro fica em modo read-only
4. Sessão expira em 1 hora

### Implementação:
- **Tabela:** `ArquitetoSession` no Prisma
- **Biblioteca:** `src/lib/arquiteto-session.ts`
- **Funções principais:**
  - `registerArquitetoSession()` - Registra nova sessão
  - `canArquitetoWrite()` - Verifica se pode escrever
  - `removeArquitetoSession()` - Remove sessão (logout)

## Fluxo de Login

### 1. Login por Email/Senha (Credentials)
- **Disponível para:** Todos os roles
- **Provider:** `"credentials"` no NextAuth
- **Processo:**
  1. Usuário insere email e senha
  2. Sistema busca usuário e valida hash de senha
  3. Se for ARQUITETO, registra `ArquitetoSession` (degradável se tabela não existir)
  4. Cria token JWT com role e informações do usuário
  5. Redireciona para home

**Resiliência:** O login por credenciais funciona **independentemente** do estado do certificado digital A1. Mesmo se a tabela `AdminCertificate` não existir ou houver problemas com o certificado, o login por senha continua funcionando normalmente.

### 2. Login por Certificado Digital A1
- **Disponível para:** Apenas ARQUITETO
- **Provider:** `"certificate"` no NextAuth
- **Processo:**
  1. Sistema lê certificado do servidor (`secrets/certs/assinatura_a1.pfx`)
  2. Valida certificado (ICP-Brasil, datas, etc.)
  3. Busca usuário associado ao certificado pelo serial number (protegido contra tabela inexistente)
  4. Verifica se usuário é ARQUITETO
  5. Registra `ArquitetoSession`
  6. Cria token JWT
  7. Redireciona para home

**Nota:** O login por certificado ainda não tem interface no frontend. O certificado é lido diretamente do servidor.

**Degradabilidade:** Se a tabela `AdminCertificate` não existir ou houver problemas, o login por certificado retorna `null` silenciosamente sem quebrar o fluxo. O sistema está preparado para funcionar mesmo sem certificado configurado.

## Write Guard

**Biblioteca:** `src/lib/write-guard-arquiteto.ts`

### Camadas de Verificação:
1. **Role:** Apenas ARQUITETO pode escrever
2. **Sessão:** Deve ter `ArquitetoSession` ativa e válida
3. **Certificado:** Deve ter certificado digital A1 válido

### Uso:
```typescript
const guard = await canWriteOperation(
  userId,
  userRole,
  "operation_type",
  operationId,
  payload,
  ip,
  userAgent
);

if (!guard.allowed) {
  return NextResponse.json({ error: guard.reason }, { status: 403 });
}
```

## Certificado Digital A1

**Configuração (`.env.local`):**
```env
CERT_A1_FILE_PATH=./secrets/certs/assinatura_a1.pfx
CERT_A1_PASSWORD="senha_do_certificado"
CERT_A1_ENFORCE_WRITES=true
```

**Uso:**
- Obrigatório para todas as operações de escrita do ARQUITETO
- Validação a cada operação (ICP-Brasil, datas, assinatura)
- Registrado em `AdminCertificate` associado ao usuário ARQUITETO

## Banco de Dados

**Banco unificado:** Localhost e produção usam o mesmo `DATABASE_URL`

**Seed inicial:**
- Apenas 1 usuário ARQUITETO:
  - Email: `[redacted-email]`
  - Senha: `[redacted-password]`
  - CPF: `[redacted-cpf]`
  - Telefone: `[redacted-phone]`
  - Data nascimento: `1974-12-27`

**Reset do banco:**
```bash
./scripts/reset-database-zerar-tudo.sh
```

## Próximos Passos

1. ✅ Implementação base da arquitetura ARQUITETO
2. ⏳ Interface de login por certificado no frontend
3. ⏳ Melhorias de UX para diferenciar permissões
4. ⏳ Login via SMS para modelos (Fase futura)
5. ⏳ Sistema de auditoria completo

