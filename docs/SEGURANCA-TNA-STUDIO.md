# Segurança TNA Studio

## 🛡️ Princípios de Segurança

### Banco de Dados Único (Dev e Produção)

**IMPORTANTE:** O sistema usa um **único banco Neon** compartilhado entre localhost e produção.

**Riscos:**
- Migrations destrutivas podem afetar produção
- Dados de desenvolvimento podem misturar com produção
- Operações simultâneas podem causar conflitos

**Mitigações:**
- **NUNCA** execute `prisma migrate reset` em produção
- Use `npx prisma migrate deploy` para aplicar migrations
- Considere usar Neon Branching para testes de migrations grandes
- Validações de ambiente no código (guards de versão)

**Aviso Explícito:**
> ⚠️ **ATENÇÃO**: Este projeto usa banco único para dev e produção. Tenha extremo cuidado ao executar comandos que modificam o banco. Sempre teste migrations em branch separado antes de aplicar em produção.

### Middleware de Autenticação

**Proteção de Rotas:**
- Todas as rotas internas são protegidas por middleware
- Verifica presença de cookie de sessão
- Validação completa de role nas páginas via `auth()`

**Rotas Públicas:**
- `/` (home/login)
- `/signin`
- `/modelo/signup`
- `/api/auth/*`

**Rotas Protegidas:**
- `/arquiteto/*` - Apenas ARQUITETO
- `/admin/*` - Apenas ADMIN
- `/modelo/*` - Apenas MODELO/CLIENTE
- `/avisos` - Apenas ARQUITETO/ADMIN
- `/loja/*` - Requer autenticação
- `/projetos/*` - Requer autenticação

### Estratégia de URLs Efêmeras

**Princípio:** Nunca expor URLs diretas do R2 ou Sync.com.

**Implementação:**
1. **Arquivos R2:**
   - Todos os arquivos são armazenados com chaves (`coverImageKey`, `termPdfKey`, `storageKey`)
   - URLs são geradas via `/api/ensaios/[id]/cover`, `/api/ensaios/[id]/term`
   - Validação de sessão e role antes de gerar URL assinada
   - Expiração curta (60-120 segundos)
   - Headers: `Cache-Control: no-store, private`

2. **Sync.com:**
   - Links nunca são expostos diretamente em JSON ou HTML
   - Rota protegida `/secure/sync/[id]` valida sessão/role
   - Conteúdo carregado em iframe com sandbox:
     ```html
     <iframe
       sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
       allow="clipboard-read; clipboard-write"
     />
     ```
   - Previne escape de conteúdo do domínio TNA-Studio

### Fluxo de Pedidos de Alteração de Dados

**Modelo/Cliente → ARQUITETO:**

1. **Solicitação:**
   - MODELO/CLIENTE acessa `/modelo/solicitar-alteracao`
   - Preenche campos permitidos (telefone, endereço, nome social, etc.)
   - **NÃO pode alterar CPF**
   - Submete → cria `ModelChangeRequest` com status `PENDING`

2. **Aprovação/Rejeição:**
   - ARQUITETO recebe aviso em `/avisos`
   - ARQUITETO acessa `/arquiteto/solicitacoes`
   - ARQUITETO aprova ou rejeita:
     - **Aprovar**: Atualiza dados do usuário, cria registro em `ModelAuditHistory`
     - **Rejeitar**: Atualiza status para `REJECTED` com motivo

3. **Auditoria:**
   - Todas as alterações são registradas em `ModelAuditHistory`
   - Campos: `userId`, `fieldModified`, `valueBefore`, `valueAfter`, `approvedById`, `timestamp`
   - Histórico completo e imutável

### Ensaios: Deleção Lógica e Limpeza Definitiva

**Deleção Lógica:**
- ARQUITETO marca ensaio como `DELETED` (status `EnsaioStatus.DELETED`)
- Ensaio não é exibido para MODELO/CLIENTE (filtro por `status: PUBLISHED`)
- Ensaio permanece no banco para possível recuperação

**Limpeza Definitiva:**
- Endpoint: `/api/arquiteto/ensaios/limpar-deletados`
- Apenas ARQUITETO pode executar
- Remove ensaios marcados como `DELETED` há mais de 7 dias
- Remove arquivos do R2 (capa, termo, fotos)
- Remove registros do banco
- Registra evento em `AuditLog`

**Avisos:**
- ARQUITETO recebe aviso em `/avisos` sobre ensaios deletados há mais de 7 dias
- ADMIN recebe aviso sobre ensaios deletados no sistema (somente leitura)

## 🚨 Riscos Conhecidos

### 1. Banco Único (Dev/Prod)
- **Risco**: Migrations destrutivas podem afetar produção
- **Mitigação**: Usar Neon Branching para testes, nunca executar `migrate reset`

### 2. URLs Efêmeras
- **Risco**: URLs podem ser compartilhadas antes de expirar
- **Mitigação**: Expiração curta (60-120s), validação de sessão a cada requisição

### 3. Sync.com Encapsulado
- **Risco**: Conteúdo pode escapar do iframe
- **Mitigação**: Sandbox restritivo, validação de sessão na rota

### 4. Solicitações de Alteração
- **Risco**: ARQUITETO pode aprovar alterações indevidas
- **Mitigação**: Histórico completo em `ModelAuditHistory`, campos restritos (CPF não pode ser alterado)

## 🔮 Pontos a Fortalecer em Versões Futuras

1. **2FA**: Implementar autenticação de dois fatores (WebAuthn, SMS)
2. **Rate Limiting**: Limitar tentativas de login e solicitações
3. **Criptografia**: Criptografar dados sensíveis em repouso
4. **Backup Automático**: Backup periódico automático do banco
5. **Monitoramento**: Alertas para atividades suspeitas
6. **Certificado A1**: Implementar validação obrigatória de certificado digital A1 ICP-Brasil para operações administrativas

## 📚 Referências

- **LGPD**: Lei Geral de Proteção de Dados
- **GDPR**: General Data Protection Regulation
- **NextAuth.js Security**: https://next-auth.js.org/configuration/options#security

---

**Versão**: 1.0.0
**Última atualização**: 2025-01-25

