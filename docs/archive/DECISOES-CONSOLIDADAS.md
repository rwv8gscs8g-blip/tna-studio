# Decisões Consolidadas - Reconstrução TNA Studio

## ✅ Decisões Finais

### 1. Provedores SMS/WhatsApp/Email
- **Decisão:** **Twilio** (integração real)
- **Detalhamento:** SMS + WhatsApp + Email via Twilio
- **Ação:** Criar módulo de integração Twilio passo a passo

### 2. Integração Sync.com
- **Decisão:** Link direto com janela popup segura controlada por sessão
- **Ação:** Criar componente de popup seguro com validação de sessão

### 3. Termo de Autorização
- **Decisão:** **Um termo por galeria** (PDF)
- **Fluxo:** Criar galeria → Upload termo → Upload fotos
- **Formato:** PDF armazenado no R2
- **Nomeação:** Data (DD/MM/AAAA) + CPF/nome da modelo
- **Ação:** Ajustar schema (TermDocument relacionado com Gallery, não Photo)

### 4. Mensagens do Admin
- **Decisão:** Área abaixo do nome da modelo
  - Mensagem geral (todos: modelos, clientes, outros)
  - Mensagem específica por modelo
- **Categorias:** Poder criar categorias (Modelos, Clientes, Outros)
- **Ação:** Criar componente de mensagens na área da modelo

### 5. Área da Modelo
- **Decisão:** Página `/model` com subpáginas
- **Estrutura:**
  - Página principal: Perfil + links para galerias
  - Cada galeria: Data (DD/MM/AAAA), link termo PDF, link Sync.com (popup seguro)
- **Edição:** Modelo e admin podem editar perfil
- **Campos:**
  - **Obrigatórios:** Telefone, email, CPF/passaporte, data nascimento (≥18)
  - **Opcionais:** Endereço completo, CEP, etc.
- **Ação:** Criar estrutura de páginas `/model` e `/model/[galleryId]`

### 6. Upload de Fotos
- **Decisão:** 
  - Fluxo: Criar galeria → Upload termo → Upload fotos
  - Apenas ADMIN pode fazer upload
  - Até 30 fotos por vez
  - Modelos podem fazer download
- **Futuro:** Módulo de renomeação automática (001.jpg → AAAA-MM-DD/CPF/nofoto)
- **Ação:** Implementar validação de termo antes de permitir upload

### 7. Validação CPF/Passaporte
- **Decisão:** Formato + dígitos verificadores (CPF), formato ICAO (passaporte)
- **Status:** ✅ Já implementado

### 8. Email/WhatsApp de Auditoria
- **Decisão:** **Twilio real** (não placeholder)
- **Frequência:** 5-30 por mês
- **Envio:** Email direto em cada login e logout (sessão expirada)
- **Informações:** Quem, quando, país, local, etc.
- **Retenção:** Dados apagados automaticamente após 6 meses (GDPR)
- **Acesso:** Apenas pessoas convidadas
- **Ação:** Criar integração Twilio completa

### 9. Sessões e Tokens
- **Decisão:**
  - **Admin:** 10 minutos
  - **Demais:** 5 minutos
- **Extensões:**
  - Tela normal: +5 minutos
  - Página Sync.com: +30 minutos
- **Limite total:** 2 horas por login
- **Após limite:** Revogar tokens, rotas e caminhos definitivamente
- **Ação:** Ajustar `auth.ts` para sessões por role

### 10. Estrutura de Galeria
- **Decisão:**
  - **Desktop:** 3 colunas (Thumbnail | Termo | Sync.com)
  - **Mobile:** 1 coluna (stack vertical)
  - **Ordenação:** Por data de ensaio (mais novos primeiro)
  - **Formato data:** AAAA/MM/DD (usado para renomeação)
- **Ação:** Criar componente GalleryGrid responsivo

### 11. Bibliotecas Técnicas
- **Lightbox:** Custom (foco em segurança e controle)
- **Drag & Drop:** Custom (menos complexidade)
- **Validação:** Zod (TypeScript-first)
- **Formulários:** react-hook-form + zod

### 12. Segurança de Galerias
- **Decisão:** 
  - Modelo só vê suas próprias galerias
  - Admin vê todas organizadas por modelo
  - Validação rigorosa de acesso
- **Ação:** Implementar validação de acesso em todas as rotas

## 📋 Ajustes Necessários no Schema

### TermDocument
- **Mudança:** Relacionar com `Gallery` ao invés de `Photo`
- **Razão:** Um termo por galeria (sessão fotográfica)

### Gallery
- **Adicionar:** Campo `sessionDate` (DateTime) - Data da sessão
- **Adicionar:** Campo `termDocumentId` (String?) - Relação com termo

## 🚀 Ordem de Implementação

### Fase 1: Fundação (✅ Completa)
1. ✅ Validadores (CPF, telefone, passaporte, email, senha)
2. ✅ Biblioteca OTP (geração e validação)
3. ✅ Schema Prisma (TermDocument relacionado com Gallery)

### Fase 2: Galerias (🔄 Em Progresso)
1. ✅ Schema ajustado (termo por galeria)
2. ⏳ Criar galeria com data de sessão
3. ⏳ Upload de termo (PDF) - obrigatório antes de fotos
4. ⏳ Upload de fotos (até 30, validação de termo)
5. ⏳ Estrutura 3 colunas (Thumbnail | Termo | Sync.com)
6. ⏳ Grid responsivo (3 colunas desktop, 1 mobile)
7. ⏳ Ordenação por data (mais novos primeiro)

### Fase 3: Área da Modelo (📋 Próxima)
1. ⏳ Página `/model` principal (perfil + lista de galerias)
2. ⏳ Subpáginas `/model/[galleryId]` (ensaio completo)
3. ⏳ Edição de perfil (modelo e admin)
4. ⏳ Mensagens do admin (geral + específica)
5. ⏳ Download de termo PDF
6. ⏳ Popup seguro para Sync.com

### Fase 4: Integração Twilio (📋 Após Galerias)
1. ⏳ Instalar dependências Twilio
2. ⏳ Criar módulo de integração (SMS, WhatsApp, Email)
3. ⏳ Configurar variáveis de ambiente
4. ⏳ Testar SMS/WhatsApp/Email

### Fase 5: Autenticação Avançada (📋 Após Twilio)
1. ⏳ Login por SMS (com Twilio)
2. ⏳ Login por WhatsApp (com Twilio)
3. ⏳ 2FA completo
4. ⏳ Sessões por role (10min admin, 5min demais)
5. ⏳ Limite de 2 horas por sessão

### Fase 6: Auditoria (📋 Após Autenticação)
1. ⏳ Sistema de logs estruturados
2. ⏳ Integração Twilio para notificações
3. ⏳ Geolocalização (IP → país/cidade)
4. ⏳ Limpeza automática (6 meses)

### Fase 7: Sync.com Gateway (📋 Após Área Modelo)
1. ⏳ Página `/sync/[galleryId]`
2. ⏳ Popup seguro com validação de sessão
3. ⏳ Extensão de sessão (+30min no Sync.com)

### Fase 8: Polimento (📋 Final)
1. ⏳ Lightbox custom (foco em segurança)
2. ⏳ UI/UX consistente
3. ⏳ Testes completos
4. ⏳ Documentação final

---

**Status:** Decisões consolidadas, pronto para implementação
**Próximo passo:** Ajustar schema e começar Fase 2 (Twilio)

