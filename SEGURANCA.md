# Segurança - TNA Studio

## 🔐 Arquitetura de Segurança

### Certificado Digital A1 ICP-Brasil (Obrigatório)

**Por que Certificado A1 é obrigatório para operações administrativas:**

1. **Validade Jurídica Plena**
   - Certificado A1 tem força probatória no Brasil conforme Lei 14.063/2020
   - Reconhecido internacionalmente pela cadeia ICP-Brasil
   - Equivalente ao mecanismo usado por plataformas críticas do governo

2. **Não-Repúdio**
   - Garantido pela cadeia ICP-Brasil
   - WebAuthn não fornece não-repúdio (limitação técnica)
   - Cada operação pode ser rastreada ao certificado específico

3. **Assinatura Digital**
   - Permite assinatura criptográfica de ações administrativas
   - Criar galeria, subir fotos, enviar termo, editar dados de modelos
   - Todas operações críticas são assinadas digitalmente

4. **Auditoria e Conformidade**
   - Comprova identidade do administrador perante auditorias
   - Atende obrigações legais (LGPD/GDPR)
   - Protege em disputas judiciais futuras

5. **Proteção contra Alterações Indevidas**
   - Previne intrusões não autorizadas
   - Evita conflitos entre ambientes (localhost/produção)
   - Desestimula acessos simultâneos

**Referências Legais:**
- **Lei 14.063/2020**: Dispositivos de segurança da informação
- **MP 2.200-2/2001**: Infraestrutura de Chaves Públicas Brasileira (ICP-Brasil)
- **ICP-Brasil**: https://www.gov.br/iti/pt-br/assuntos/repositorio/icp-brasil

**Comparação: Certificado A1 vs WebAuthn**

| Aspecto | Certificado A1 | WebAuthn |
|---------|----------------|----------|
| **Validade Jurídica** | ✅ Total (Lei 14.063/2020) | ❌ Não |
| **Não-Repúdio** | ✅ Sim (ICP-Brasil) | ❌ Não |
| **Assinatura Digital** | ✅ Sim | ❌ Não |
| **Cadeia ICP** | ✅ Sim | ❌ Não |
| **Biometria** | ⚠️ Via token | ✅ Sim (nativo) |
| **Complexidade** | Alta | Baixa |
| **Uso Recomendado** | Escrita admin (obrigatório) | 2FA login (opcional) |

**Conclusão**: WebAuthn é excelente para 2FA e login, mas **NÃO substitui** Certificado A1 para operações administrativas.

---

## 🛡️ Seis Camadas de Verificação

Toda operação administrativa de escrita deve passar por **6 camadas obrigatórias**:

### Camada 1: Certificado A1 ✅
- Certificado deve ser válido e não expirado
- Certificado deve ser ICP-Brasil
- Certificado deve estar associado ao admin
- Certificado deve estar ativo

### Camada 2: Login do Admin ✅
- Usuário deve ter role ADMIN
- Sessão deve estar válida
- Token JWT deve estar válido

### Camada 3: Script Pré-Start ✅
- Script de validação deve ter sido executado
- `preStartValidated` deve ser `true` na AdminSession
- Schema, código e migrations devem estar sincronizados

### Camada 4: Ambiente ✅
- Localhost não pode estar conectado ao banco de produção (sem Neon Branching)
- Não pode haver sessão ativa em outro ambiente
- Ambiente deve ser consistente

### Camada 5: Guard de Versão ✅
- Versão de código deve corresponder à autorizada
- Versão de migrations deve corresponder à autorizada
- `writeEnabled` deve ser `true` na AdminSession

### Camada 6: Integridade do Schema ✅
- Hash do schema.prisma deve corresponder ao autorizado
- Schema não pode ter divergências não autorizadas

**Nenhuma operação administrativa pode ser executada sem passar por todas as 6 camadas.**

---

## 📋 Script Pré-Start Obrigatório

### O Que Valida

1. **Schema Prisma**
   - Compara hash da migration local vs hash da migration aplicada em produção
   - Impede boot se houver divergência
   - Exibe relatório detalhado

2. **Versão do Código**
   - Calcula checksums de submódulos, libs internas, componentes críticos
   - Compara Git commit SHA local vs produção
   - Impede boot se não bater

3. **Versionamento Interno**
   - Verifica `AppConfig.codeVersion`
   - Verifica `AppConfig.schemaVersion`
   - Verifica `AppConfig.migrationVersion`
   - Se divergente → impede boot

4. **Ambiente**
   - Se localhost estiver com DB de produção e houver mismatch → bloqueia
   - Recomenda uso de Neon Branching

5. **Fluxo de Restauração**
   - Se REJEITADO → restaura automaticamente schema e build da última release estável
   - Ou exibe instruções manuais

### Quando Executa

- ✅ Antes de `npm run dev`
- ✅ Antes de qualquer `prisma migrate`
- ✅ Antes de permissões administrativas

### Como Usar

```bash
# Validação manual
npm run validate

# Desenvolvimento (validação automática)
npm run dev

# Desenvolvimento sem validação (NÃO RECOMENDADO)
npm run dev:unsafe
```

---

## 🔑 Super User

### Papel

- **NÃO pode escrever** no banco diretamente
- **PODE trocar** o certificado A1 autorizado
- **PODE gerenciar** certificados de admins
- **PODE atualizar** versões autorizadas em AppConfig
- **Atua como guardião** do mecanismo de confiança

### Operações Permitidas

- ✅ Criar/ativar/desativar certificados de admin
- ✅ Atualizar `AppConfig` (versões autorizadas)
- ✅ Visualizar logs de operações administrativas
- ✅ Gerenciar sessões de admin

### Operações Bloqueadas

- ❌ Criar/editar/deletar galerias
- ❌ Upload de fotos/termos
- ❌ Modificar dados de usuários (exceto certificados)

---

## 🌐 Neon Branching

### Estratégia de Isolamento

Neon Branching é usado como **camada adicional de isolamento**:

- ✅ **Isolamento para testar migrations** - Pode testar migrations destrutivas sem risco
- ✅ **Prevenção de corrupção acidental** - Zero risco de corromper produção
- ✅ **Rollback rápido** - Pode descartar branch e recriar
- ✅ **Teste de versões** - Testa código antes do merge para produção

### Como Funciona

1. Criar branch de produção no Neon
2. Localhost aponta para branch (não produção direta)
3. Desenvolvimento livre no branch
4. Quando pronto, merge para produção
5. Branch pode ser descartado ou mantido

**Documentação Neon**: https://neon.tech/docs/branching

---

## 🔐 Autenticação e Autorização

### Login

**Opções:**
- Email + Senha (atual)
- gov.br OAuth (futuro - opcional)
- WebAuthn (2FA - opcional)

**Recomendação**: gov.br ou WebAuthn para login (biometria, melhor UX)

### Escrita Admin

**Obrigatório:**
- Certificado A1 ICP-Brasil
- Login válido
- Todas as 6 camadas de verificação

**Nunca**: WebAuthn sozinho para escrita (não tem validação jurídica)

---

## 📊 Auditoria

### Logs de Operações Administrativas

Toda operação administrativa é registrada em `AdminOperation`:

- `operationType` - Tipo de operação
- `certificateSerial` - Certificado usado
- `signatureHash` - Hash da assinatura digital
- `signatureData` - Dados assinados
- `ip`, `userAgent` - Origem
- `success`, `errorMessage` - Resultado

### Retenção

- Logs mantidos por 6 meses (conforme GDPR)
- Limpeza automática após 6 meses
- Exportação disponível para auditorias

---

## 🚨 Mecanismos de Prevenção

### 1. Prevenção de Corrupção de Dados

- ✅ Script pré-start valida antes de iniciar
- ✅ Guards de versão em runtime
- ✅ Neon Branching para isolamento
- ✅ Validação de schema antes de operações críticas

### 2. Prevenção de Acesso Não Autorizado

- ✅ Certificado A1 obrigatório
- ✅ Seis camadas de verificação
- ✅ Sessões efêmeras (10min admin)
- ✅ Bloqueio de admin duplo

### 3. Prevenção de Operações Simultâneas

- ✅ AdminSession rastreia ambiente
- ✅ Bloqueia se ativo em outro ambiente
- ✅ Valida versões antes de permitir escrita

---

## 🧪 Módulo de Testes de Segurança

### Status: Isolado e Experimental

Existe um **módulo de testes de segurança** que permite validar Certificado A1 e gov.br login **sem impactar o fluxo atual** de autenticação.

**Características:**
- ✅ Totalmente isolado do fluxo de produção
- ✅ Só funciona quando `SECURITY_TEST_MODE=true`
- ✅ Não altera comportamento atual do login (`/signin`)
- ✅ Não exige Certificado A1 para operações reais ainda
- ✅ Não cria dependência circular com `auth.ts`

### Teste de Certificado A1

**Rota**: `/security/test-a1` (apenas admin/super_admin)

**Funcionalidades:**
- Valida certificado A1 ICP-Brasil a partir de arquivo `.pfx/.p12`
- Extrai metadados (subject, issuer, serial, datas, OIDs)
- Executa assinatura digital de teste
- Valida cadeia ICP-Brasil (na medida do possível)

**Configuração:**
```env
SECURITY_TEST_MODE=true
CERT_A1_FILE_PATH=./secrets/certs/assinatura_a1.pfx
CERT_A1_PASSWORD=********
```

**Importante:**
- Certificado nunca deve ser commitado no Git
- Sempre use caminho de arquivo e senha via variáveis de ambiente
- Pasta `secrets/` está no `.gitignore`

### Teste Experimental gov.br

**Rota**: `/security/test-govbr` (apenas admin/super_admin)

**Funcionalidades:**
- Testa integração OAuth 2.0 com gov.br
- Valida claims retornados (CPF, nome, nível de segurança)
- Não cria conta real, não grava nada persistente

**Configuração:**
```env
SECURITY_TEST_MODE=true
ENABLE_GOVBR_EXPERIMENTAL=true
GOVBR_CLIENT_ID=seu_client_id
GOVBR_CLIENT_SECRET=seu_client_secret
```

**Limitações:**
- Requer credenciais do gov.br
- Pode não haver SDK oficial para Next.js
- Serve apenas para avaliar viabilidade técnica e jurídica

**Documentação**: `docs/GOVBR-EXPERIMENTAL-NOTES.md`

### Ativação Futura

A validação obrigatória via Certificado A1 e os guards de escrita serão ativados em fase posterior, quando explicitamente habilitado:

```env
CERT_A1_ENFORCE_WRITES=true
```

**Até lá:**
- Módulo de testes permite validar certificados sem risco
- Fluxo atual de login permanece inalterado
- Operações administrativas não exigem certificado ainda

## 📚 Referências

- **ICP-Brasil**: https://www.gov.br/iti/pt-br/assuntos/repositorio/icp-brasil
- **Lei 14.063/2020**: Dispositivos de segurança da informação
- **MP 2.200-2/2001**: Infraestrutura de Chaves Públicas Brasileira
- **LGPD**: Lei Geral de Proteção de Dados
- **GDPR**: General Data Protection Regulation

## 🔄 Resiliência, Rollback e Auditoria

### Estratégia de Rollback

**Neon Branching:**
- ✅ Criar branch antes de migrations grandes
- ✅ Testar no branch antes de promover
- ✅ Rollback rápido apontando DATABASE_URL para branch anterior
- ✅ Point-in-Time Restore disponível (se plano Neon suportar)

**Backup Lógico:**
- ✅ Script `scripts/backup/backup-logico.sh` faz dump completo
- ✅ Checksum SHA256 para integridade
- ✅ Armazenar em local seguro (Sync.com, cofre)
- ✅ NUNCA commitar no Git
- ✅ Manter por 6 meses (conforme GDPR)

**Documentação completa**: `docs/NEON-BRANCHING-STRATEGY.md`

### Auditoria de Operações Críticas

**Todas operações de branching/rollback são:**
- ✅ Restritas ao SUPER_ADMIN
- ✅ Assinadas com Certificado A1
- ✅ Registradas em AdminOperation

**Tipos auditados:**
- `switch_database_branch` - Troca de branch
- `rollback_point_in_time` - Rollback temporal
- `apply_dump_restore` - Restauração de backup
- `promote_branch` - Promoção de branch

### Importância de Errar Cedo

**Branch separado permite:**
- ✅ Testar migrations destrutivas sem risco
- ✅ Validar antes de aplicar em produção
- ✅ Descartar se necessário
- ✅ Zero impacto em dados reais

---

**Última atualização**: 2025-01-20  
**Versão**: 2.0.0 (Modo Real - Certificado A1 Obrigatório)

