# Arquitetura TNA Studio

## 🎯 Visão Geral

Plataforma segura para gerenciamento de galerias fotográficas com controle de acesso granular, armazenamento privado e sessões efêmeras.

## 🏗️ Stack Tecnológico

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Autenticação**: NextAuth.js v5 (JWT, Credentials Provider)
- **Banco de Dados**: PostgreSQL (Neon) + Prisma ORM
- **Storage**: Cloudflare R2 (S3-compatible)
- **Comunicação**: Twilio (SMS, WhatsApp, Email)
- **Deploy**: Vercel (Edge + Node.js runtimes)
- **Validação**: Zod + react-hook-form

## 🔐 Segurança

### Certificado Digital A1 ICP-Brasil (Obrigatório)

**Por que Certificado A1 é obrigatório para operações administrativas:**

1. **Validade Jurídica Plena** (Lei 14.063/2020)
   - Fornece força probatória no Brasil
   - Reconhecido internacionalmente pela cadeia ICP-Brasil
   - Equivalente ao mecanismo usado por plataformas críticas do governo (e-CAC, SEFAZ, eSocial)

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

**Referências Legais:**
- Lei 14.063/2020: Dispositivos de segurança da informação
- MP 2.200-2/2001: Infraestrutura de Chaves Públicas Brasileira (ICP-Brasil)
- ICP-Brasil: https://www.gov.br/iti/pt-br/assuntos/repositorio/icp-brasil

**Comparação: Certificado A1 vs WebAuthn**

| Aspecto | Certificado A1 | WebAuthn |
|---------|----------------|----------|
| Validade Jurídica | ✅ Total | ❌ Não |
| Não-Repúdio | ✅ Sim | ❌ Não |
| Assinatura Digital | ✅ Sim | ❌ Não |
| Cadeia ICP | ✅ Sim | ❌ Não |
| Biometria | ⚠️ Via token | ✅ Sim |
| Uso | Escrita admin (obrigatório) | 2FA login (opcional) |

**Conclusão**: WebAuthn é excelente para 2FA e login, mas **NÃO substitui** Certificado A1 para operações administrativas.

### Seis Camadas de Verificação

Toda operação administrativa de escrita deve passar por **6 camadas obrigatórias**:

1. **Certificado A1** - Certificado válido, ICP-Brasil, associado ao admin, ativo
2. **Login do Admin** - Usuário com role ADMIN, sessão válida, token JWT válido
3. **Script Pré-Start** - Validação executada, schema/código/migrations sincronizados
4. **Ambiente** - Localhost não conectado à produção, sem sessão ativa em outro ambiente
5. **Guard de Versão** - Código e migrations correspondem às versões autorizadas
6. **Integridade do Schema** - Hash do schema.prisma corresponde ao autorizado

**Nenhuma operação administrativa pode ser executada sem passar por todas as 6 camadas.**

### Script Pré-Start Obrigatório

**Validações:**
- Schema Prisma (hash de migrations)
- Versão do código (Git commit SHA)
- Versionamento interno (AppConfig)
- Ambiente (localhost vs produção)

**Quando executa:**
- Antes de `npm run dev`
- Antes de qualquer `prisma migrate`
- Antes de permissões administrativas

**Fluxo de restauração:**
- Se REJEITADO → restaura automaticamente schema e build da última release estável

### Sessões e Tokens

**Sessões por Role:**
- **Admin**: 10 minutos
- **Modelo/Cliente**: 5 minutos
- **Extensões**: +5min (tela normal), +30min (Sync.com)
- **Limite total**: 2 horas por login

**Validação 100% no Servidor:**
- Expiração validada em cada requisição no callback `jwt`
- Tokens inválidos retornam `null` → sessão expirada
- Build timestamp invalida tokens de builds anteriores
- Cliente não é confiável para decisões de segurança

**Revogação:**
- Após 2 horas: tokens, rotas e caminhos revogados definitivamente
- Logout manual: limpeza completa de cookies e tokens
- Restart do servidor: invalida todas as sessões antigas

### Armazenamento

**R2 Privado:**
- Sem acesso público direto
- URLs assinadas com expiração (1 hora padrão)
- Validação de permissões antes de gerar URL
- Modo mock em desenvolvimento (rota local)

**Estrutura de Arquivos:**
```
AAAA-MM-DD/cpf-{CPF}/photo-{SEQ}.{ext}
AAAA-MM-DD/cpf-{CPF}/term.pdf
```

### Middleware

**Limitações:**
- Tamanho máximo: 1 MB (Vercel free plan)
- Edge Runtime (sem Prisma direto)
- Apenas validação de cookie de sessão

**Proteções:**
- Rotas protegidas (exceto `/signin`, `/api/auth`)
- Headers de segurança (X-Content-Type-Options, etc.)
- Limpeza automática de cookies antigos

## 📊 Modelo de Dados

### Entidades Principais

**User:**
- Autenticação: email, passwordHash, phone, cpf/passport
- Perfil: name, profileImage, personalDescription
- Aceites: lgpdAccepted, gdprAccepted, termsAccepted
- Endereço: address, zipCode, city, state, country (opcionais)

**Gallery:**
- Identificação: title, description, sessionDate
- Relacionamentos: userId, termDocumentId
- Sync.com: syncLink, syncPassword
- Privacidade: isPrivate

**Photo:**
- Armazenamento: key (path R2), hash (SHA256)
- Metadados: title, mimeType, bytes
- Relacionamento: galleryId

**TermDocument:**
- Um termo por galeria (PDF)
- Armazenamento: key (R2), mimeType, bytes
- Relacionamento: galleryId

**OtpToken:**
- OTP de 6 dígitos, TTL 5 minutos
- Campos: phone, email, cpf/passport, ip, userAgent

**AuditLog:**
- Logs de login/logout
- Campos: userId, email, role, ip, country, city, method, action
- Retenção: 6 meses (limpeza automática)

**AdminMessage:**
- Tipos: global, models, clients, specific
- Campos: type, targetUserId, title, content

**AppConfig:**
- Singleton (sempre um único registro)
- Versões autorizadas: codeVersion, schemaVersion, migrationVersion
- Flags: productionWriteEnabled, preStartValidationEnabled

**AdminSession:**
- Rastreamento de ambiente (localhost/production)
- Versões: codeVersion, schemaVersion, migrationVersion
- Flags: writeEnabled, preStartValidated
- Expiração baseada em token JWT

**AdminCertificate:**
- Certificado A1 ICP-Brasil associado a admin
- Campos: certificateHash, certificateEncrypted, serialNumber, issuer
- Validade: validFrom, validUntil
- Status: isActive, lastUsedAt

**AdminOperation:**
- Auditoria de operações administrativas assinadas
- Campos: operationType, certificateSerial, signatureHash, signatureData
- Rastreamento: ip, userAgent, success, errorMessage

## 🔄 Fluxos Principais

### Criação de Galeria (Admin)

**Pré-requisitos:**
1. Certificado A1 válido e ativo
2. Todas as 6 camadas de verificação passadas
3. Script pré-start validado

**Fluxo:**
1. Validar certificado A1 e assinar operação
2. Criar galeria com `sessionDate`
3. Upload de termo PDF (obrigatório) - assinado
4. Upload de fotos (até 30, validação de termo) - assinado
5. Configurar link Sync.com (opcional) - assinado
6. Registrar operação em AdminOperation (auditoria)

### Visualização (Modelo)

1. Acessar `/model` (lista de galerias)
2. Ver galeria: data, termo, link Sync.com
3. Clicar em foto → página filha com 30 fotos
4. Download de termo PDF
5. Acessar Sync.com via popup seguro

### Autenticação

**Atual (Email + Senha):**
- Credentials Provider
- Validação de senha forte
- Rate limiting (5 tentativas/minuto)

**Futuro (SMS/WhatsApp):**
- OTP de 6 dígitos via Twilio
- Validação de telefone E.164
- Validação de CPF/passaporte
- 2FA opcional

## 🛡️ Validações

### Entrada de Dados

**CPF:**
- Formato: 11 dígitos
- Validação: dígitos verificadores

**Telefone:**
- Formato: E.164 (+CC DDD Nº)
- Normalização automática

**Passaporte:**
- Formato: ICAO (2 letras + 6-9 alfanuméricos)

**Email:**
- Formato: RFC 5322

**Data de Nascimento:**
- Validação: ≥ 18 anos

**Senha:**
- Mínimo: 8 caracteres
- Requisitos: maiúscula, minúscula, número, símbolo

### Upload

**Fotos:**
- Tamanho máximo: 50 MB
- Tipos: jpg, jpeg, png, webp, tiff
- Rate limit: 10 uploads/minuto por usuário/IP
- Hash: SHA256 salvo no banco

**Termo:**
- Formato: PDF
- Obrigatório antes de upload de fotos
- Apenas admin pode fazer upload

## 📱 Interface

### Estrutura de Páginas

**Públicas:**
- `/signin` - Login (email/senha, SMS, WhatsApp)

**Autenticadas:**
- `/` - Home
- `/galleries` - Lista de galerias
- `/galleries/[id]` - Detalhes da galeria (3 colunas)
- `/galleries/[id]/preview` - Ensaio completo (30 fotos)
- `/model` - Área da modelo (perfil + galerias)
- `/model/[galleryId]` - Galeria específica da modelo
- `/profile` - Editar perfil
- `/admin/*` - Painel administrativo

**Especiais:**
- `/sync/[galleryId]` - Gateway Sync.com (popup seguro)

### Componentes Principais

- `Navigation` - Barra de navegação com timer de sessão
- `SessionTimer` - Timer visual com extensão
- `GalleryGrid` - Grid 3 colunas responsivo
- `PhotoLightbox` - Lightbox custom (segurança)
- `TermUpload` - Upload de termo PDF
- `SyncPopup` - Popup seguro para Sync.com

## 🔔 Notificações

### Auditoria (Twilio)

**Email:**
- Destino: token@zanin.art.br
- Eventos: login, logout, sessão expirada
- Conteúdo: usuário, role, IP, localização, horário

**WhatsApp:**
- Destino: [redacted-phone]
- Eventos: login, logout
- Conteúdo: resumo do acesso

**Frequência:**
- 5-30 notificações por mês
- Retenção: 6 meses (limpeza automática)

## 🚀 Deploy

### Variáveis de Ambiente

**Obrigatórias:**
- `DATABASE_URL`, `DIRECT_URL`
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`

**Twilio (Fase 4):**
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`, `TWILIO_WHATSAPP_NUMBER`
- `SENDGRID_API_KEY` ou `RESEND_API_KEY`
- `EMAIL_FROM`, `EMAIL_TO_AUDIT`, `WHATSAPP_TO_AUDIT`

### Limitações

- **Middleware**: < 1 MB (Vercel free)
- **Edge Runtime**: Sem Prisma direto
- **Node.js Runtime**: APIs e páginas dinâmicas

## 🌐 Neon Branching

**Estratégia de Isolamento:**

Neon Branching é usado como **camada adicional de isolamento**:

- ✅ **Isolamento para testar migrations** - Pode testar migrations destrutivas sem risco
- ✅ **Prevenção de corrupção acidental** - Zero risco de corromper produção
- ✅ **Rollback rápido** - Pode descartar branch e recriar
- ✅ **Teste de versões** - Testa código antes do merge para produção

**Como funciona:**
1. Criar branch de produção no Neon
2. Localhost aponta para branch (não produção direta)
3. Desenvolvimento livre no branch
4. Quando pronto, merge para produção
5. Branch pode ser descartado ou mantido

**Documentação Neon**: https://neon.tech/docs/branching

## 🔑 Super User

**Papel:**
- **NÃO pode escrever** no banco diretamente
- **PODE trocar** o certificado A1 autorizado
- **PODE gerenciar** certificados de admins
- **PODE atualizar** versões autorizadas em AppConfig
- **Atua como guardião** do mecanismo de confiança

**Operações permitidas:**
- ✅ Criar/ativar/desativar certificados de admin
- ✅ Atualizar `AppConfig` (versões autorizadas)
- ✅ Visualizar logs de operações administrativas
- ✅ Gerenciar sessões de admin

**Operações bloqueadas:**
- ❌ Criar/editar/deletar galerias
- ❌ Upload de fotos/termos
- ❌ Modificar dados de usuários (exceto certificados)

## 🧪 Módulo de Testes de Segurança

### Status: Isolado e Experimental

Existe um **módulo de testes de segurança** que permite validar Certificado A1 e gov.br login **sem impactar o fluxo atual** de autenticação.

**Características:**
- ✅ Totalmente isolado do fluxo de produção
- ✅ Só funciona quando `SECURITY_TEST_MODE=true`
- ✅ Não altera comportamento atual do login (`/signin`)
- ✅ Não exige Certificado A1 para operações reais ainda

**Rotas de Teste:**
- `/security/test-a1` - Teste de Certificado A1 ICP-Brasil
- `/security/test-govbr` - Teste experimental gov.br login

**Ativação Futura:**
- Validação obrigatória via Certificado A1 será ativada com `CERT_A1_ENFORCE_WRITES=true`
- Guards de escrita serão integrados em fase posterior

**Documentação:**
- `SEGURANCA.md` - Seção "Módulo de Testes de Segurança"
- `docs/GOVBR-EXPERIMENTAL-NOTES.md` - Notas experimentais gov.br

## 🗄️ Banco de Dados Unificado

### Arquitetura

**Um único banco Neon** compartilhado entre localhost e produção:

- ✅ **DATABASE_URL** e **DIRECT_URL** apontam para o mesmo banco
- ✅ **Localhost e produção** são dois "clientes" diferentes acessando o mesmo banco
- ✅ **Integridade garantida** por:
  - Script pré-start (valida schema, código, migrations)
  - Version-guards (valida versões antes de escrita)
  - AdminSession (rastreia ambiente e versões)
  - Certificado A1 obrigatório (validação jurídica)

### Neon Branching

**Estratégia de isolamento e rollback:**

- **Branch Principal (prod/main)**: Usado por produção e localhost em modo normal
- **Branch de Trabalho (dev-local / feature-*)**: Para experimentos arriscados, migrations grandes

**Fluxo recomendado:**
1. Desenvolvimento normal → branch principal
2. Migration grande → criar branch temporário → testar → promover ou descartar
3. Rollback → apontar DATABASE_URL para branch anterior

**Documentação completa**: `docs/NEON-BRANCHING-STRATEGY.md`

### Backup Lógico

**Script de backup periódico:**
- `scripts/backup/backup-logico.sh` - Dump completo + checksum SHA256
- Armazenar em local seguro (nunca commitar no Git)
- Manter por 6 meses (conforme GDPR)

## 📚 Documentação

- `README.md` - Visão geral e setup
- `ARQUITETURA.md` - Este documento
- `SEGURANCA.md` - Arquitetura de segurança detalhada
- `DECISOES-CONSOLIDADAS.md` - Decisões de produto
- `INTEGRACAO-TWILIO-PASSO-A-PASSO.md` - Guia Twilio
- `AVALIACAO-ARQUITETURA-FINAL.md` - Avaliação técnica completa
- `docs/GOVBR-EXPERIMENTAL-NOTES.md` - Notas experimentais gov.br
- `docs/NEON-BRANCHING-STRATEGY.md` - Estratégia de branching e rollback
- `RESUMO-MIGRACAO-MODO-REAL.md` - Resumo da migração para modo real

---

**Versão**: 1.0.0 (Modo Real - Certificado A1 Obrigatório)
**Última atualização**: 2025-01-20

