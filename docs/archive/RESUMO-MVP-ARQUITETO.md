# Resumo MVP - Arquitetura ARQUITETO

**Data:** 2025-11-21  
**Versão:** 1.0

## Visão Geral

Esta mudança arquitetural estabelece o **ARQUITETO** como o único perfil com direitos de escrita no sistema TNA Studio, simplificando o controle e eliminando problemas anteriores de login e permissões.

## O Que Foi Alterado

### 1. Schema e Banco de Dados
- ✅ Adicionado role `ARQUITETO` ao enum `Role`
- ✅ Tabela `AdminSession` substituída por `ArquitetoSession`
- ✅ Migration criada (`20251121201322_add_arquiteto_role_and_session`)

### 2. Bibliotecas e Guards
- ✅ `src/lib/arquiteto-session.ts` - Gestão de sessão única do Arquiteto
- ✅ `src/lib/certificate-login.ts` - Login via certificado digital A1
- ✅ `src/lib/write-guard-arquiteto.ts` - Guards simplificados (apenas ARQUITETO pode escrever)

### 3. Autenticação
- ✅ Provider de certificado digital A1 adicionado ao NextAuth
- ✅ Provider credentials atualizado para registrar `ArquitetoSession`
- ✅ Logout atualizado para remover `ArquitetoSession`

### 4. Endpoints de API
- ✅ `/api/admin/users` - Escrita apenas para ARQUITETO
- ✅ `/api/admin/users/[id]` - Escrita apenas para ARQUITETO; leitura para ADMIN/SUPER_ADMIN
- ✅ `/api/galleries` - Escrita apenas para ARQUITETO; leitura conforme perfil
- ✅ `/api/galleries/[id]` - Escrita apenas para ARQUITETO; leitura conforme perfil
- ✅ `/api/media/upload` - Upload apenas para ARQUITETO
- ✅ `/api/super-admin/certificates/upload` - Apenas SUPER_ADMIN (trocar certificado)

### 5. Seed e Reset
- ✅ `prisma/seed.ts` atualizado - Apenas primeiro ARQUITETO (Luís Maurício)
- ✅ `scripts/reset-database-zerar-tudo.sh` criado para reset completo

### 6. Documentação
- ✅ `STATUS-ARQUITETURA-ARQUITETO.md` - Diagnóstico do estado atual
- ✅ `ARQUITETURA-ARQUITETO.md` - Documentação da nova arquitetura
- ✅ `SEGURANCA-A1.md` - Documentação do certificado digital A1
- ✅ `CHECKLIST-MVP-ARQUITETO.md` - Checklist de validação

## Como Iniciar do Zero

### 1. Configurar Ambiente
```bash
# Copiar .env.local.example para .env.local (se existir)
# Ou criar .env.local com as variáveis necessárias:
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
CERT_A1_FILE_PATH="./secrets/certs/assinatura_a1.pfx"  # Opcional
CERT_A1_PASSWORD="senha_do_certificado"                # Opcional
CERT_A1_ENFORCE_WRITES="false"                         # Opcional
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Resetar e Configurar Banco
```bash
# Resetar banco e criar seed inicial
./scripts/reset-database-zerar-tudo.sh
```

### 4. Iniciar Servidor
```bash
npm run dev
```

### 5. Fazer Login
- **Email:** `[redacted-email]`
- **Senha:** `[redacted-password]`
- **Perfil:** `ARQUITETO`

## Papéis e Permissões

### ARQUITETO
- **Único** perfil com direitos de escrita
- Pode criar, editar e excluir tudo
- Login por email/senha ou certificado A1
- Sessão única (apenas um por vez)

### SUPER_ADMIN
- **Única função:** Trocar certificado digital A1
- Somente leitura para tudo mais
- Login por email/senha

### ADMIN
- Somente leitura ampla (pode ver tudo)
- Não pode editar nada
- Login por email/senha

### MODEL / CLIENT
- Somente leitura dos próprios dados
- Pode visualizar e baixar apenas suas galerias/arquivos
- Login por email/senha

## Próximos Passos Recomendados

### Curto Prazo (MVP)
1. ✅ Aplicar migration em produção
2. ⏳ Testar login em produção
3. ⏳ Testar criação de galeria como ARQUITETO
4. ⏳ Testar upload de fotos como ARQUITETO
5. ⏳ Validar que ADMIN/SUPER_ADMIN veem dados mas não editam

### Médio Prazo
1. Interface de login por certificado no frontend
2. Melhorias de UX para diferenciar permissões (botões desabilitados para read-only)
3. Sistema de auditoria completo (logs de todas as operações)

### Longo Prazo
1. Login via SMS para modelos (Twilio)
2. Sistema 2FA completo
3. Melhorias de segurança e performance

## Problemas Conhecidos

### Menores
- Login por certificado A1 ainda não tem interface no frontend (funciona via API)
- Alguns endpoints podem precisar de ajustes finos após testes

### A Resolver
- Interface de login por certificado no frontend
- Melhorias de UX para read-only (indicar visualmente que não pode editar)

## Arquivos Importantes

### Código
- `prisma/schema.prisma` - Schema do banco
- `src/lib/arquiteto-session.ts` - Sessão do Arquiteto
- `src/lib/write-guard-arquiteto.ts` - Guards de escrita
- `src/auth.ts` - Autenticação (NextAuth)

### Scripts
- `scripts/reset-database-zerar-tudo.sh` - Reset completo do banco
- `prisma/seed.ts` - Seed inicial (apenas ARQUITETO)

### Documentação
- `STATUS-ARQUITETURA-ARQUITETO.md` - Estado atual do sistema
- `ARQUITETURA-ARQUITETO.md` - Documentação da arquitetura
- `SEGURANCA-A1.md` - Documentação do certificado A1
- `CHECKLIST-MVP-ARQUITETO.md` - Checklist de validação

## Suporte

Para dúvidas ou problemas:
1. Verificar `STATUS-ARQUITETURA-ARQUITETO.md` para estado atual
2. Verificar `CHECKLIST-MVP-ARQUITETO.md` para validar configuração
3. Consultar documentação específica conforme necessário

