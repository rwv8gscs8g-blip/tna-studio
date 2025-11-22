# Plano de Reconstrução Completa - TNA Studio

## 🎯 Objetivo Geral

Reconstruir o TNA-Studio com funcionalidades avançadas mantendo:
- ✅ Segurança como prioridade absoluta
- ✅ Arquitetura atual validada
- ✅ Middleware < 1 MB
- ✅ APIs seguras (R2, Neon, NextAuth v5)

## 📋 Módulos e Ordem de Execução

### FASE 1: Fundação e Autenticação Avançada

#### Módulo 1.1: Login por SMS (OTP)
**Prioridade:** ALTA
**Complexidade:** MÉDIA

**Requisitos:**
- Validação telefone E.164 (+CC DDD Nº)
- Validação CPF (dígitos verificadores)
- Validação Passaporte (padrão ICAO)
- Validação data nascimento (≥ 18 anos)
- Validação email (RFC 5322)
- Geração OTP 6 dígitos
- Armazenamento no banco (telefone, IP, user-agent, CPF/doc, TTL 5min)
- Envio SMS (placeholder MVP)

**Arquivos a criar/modificar:**
- `src/lib/validators.ts` - Validações (CPF, telefone, passaporte, email)
- `src/lib/otp.ts` - Geração e validação de OTP
- `src/app/signin-sms/page.tsx` - Tela de login por SMS
- `src/app/signin-sms/verify/page.tsx` - Tela de verificação OTP
- `src/app/api/auth/sms/send/route.ts` - API para enviar SMS
- `src/app/api/auth/sms/verify/route.ts` - API para verificar OTP
- `prisma/schema.prisma` - Adicionar modelo `OtpToken`

**Dependências externas:**
- Provedor SMS (Twilio/Zenvia) - placeholder no MVP

#### Módulo 1.2: Login por WhatsApp
**Prioridade:** MÉDIA
**Complexidade:** MÉDIA

**Requisitos:**
- Mesmos campos do SMS
- Envio via WhatsApp (Twilio/Meta)
- Mesma estrutura de OTP

**Arquivos:**
- `src/app/signin-whatsapp/page.tsx`
- `src/app/api/auth/whatsapp/send/route.ts`
- `src/app/api/auth/whatsapp/verify/route.ts`

#### Módulo 1.3: Login por Email + Senha (Secundário)
**Prioridade:** ALTA (já existe, melhorar)
**Complexidade:** BAIXA

**Requisitos:**
- Melhorar validação de senha
- Adicionar "Esqueci a senha"
- Menu lateral "Outras formas de autenticação"

**Arquivos:**
- `src/app/signin/page.tsx` - Melhorar
- `src/app/signin/forgot-password/page.tsx` - Novo
- `src/app/api/auth/forgot-password/route.ts` - Novo
- `src/lib/password-validator.ts` - Novo

#### Módulo 1.4: Dois Fatores (2FA)
**Prioridade:** ALTA
**Complexidade:** MÉDIA

**Requisitos:**
- Após login, enviar confirmação (email/SMS/WhatsApp)
- Mensagem de segurança
- Validação de 2FA antes de permitir acesso

**Arquivos:**
- `src/app/signin/2fa/page.tsx` - Novo
- `src/app/api/auth/2fa/send/route.ts` - Novo
- `src/app/api/auth/2fa/verify/route.ts` - Novo
- `prisma/schema.prisma` - Adicionar campo `twoFactorEnabled` em User

#### Módulo 1.5: Logout Seguro
**Prioridade:** ALTA (já existe, melhorar)
**Complexidade:** BAIXA

**Requisitos:**
- Revogar todos os tokens
- Limpar cookies
- Mensagem de segurança na página de login

**Arquivos:**
- `src/app/api/auth/logout/route.ts` - Melhorar
- `src/app/signin/page.tsx` - Adicionar mensagem

#### Módulo 1.6: Auditoria Automática
**Prioridade:** ALTA
**Complexidade:** MÉDIA

**Requisitos:**
- Email para token@zanin.art.br em cada login
- WhatsApp para [redacted-phone] em cada login
- Logs estruturados no banco

**Arquivos:**
- `src/lib/audit.ts` - Novo
- `src/lib/notifications.ts` - Novo (email/WhatsApp)
- `prisma/schema.prisma` - Adicionar modelo `AuditLog`
- `src/app/api/auth/audit/route.ts` - Novo

### FASE 2: Cadastro e Validações

#### Módulo 2: Sign-In Completo
**Prioridade:** ALTA
**Complexidade:** MÉDIA

**Requisitos:**
- Campos obrigatórios com validações
- Aceite LGPD/GDPR/Termos
- Email de boas-vindas
- WhatsApp para admin

**Arquivos:**
- `src/app/signup/page.tsx` - Novo/Reconstruir
- `src/app/api/auth/signup/route.ts` - Novo
- `src/lib/validators.ts` - Expandir
- Templates de email

### FASE 3: Galerias Profissionais

#### Módulo 3.1: Upload Apenas para ADMIN
**Prioridade:** ALTA
**Complexidade:** BAIXA

**Requisitos:**
- Upload até 50 MB
- Extensões: jpg, jpeg, png, webp, tiff
- Nomeação: `cpf-{CPF}/session-{ID}/photo-{SEQ}.{ext}`
- Hash SHA256 no banco

**Arquivos:**
- `src/app/api/media/upload/route.ts` - Modificar
- `src/lib/image-naming.ts` - Melhorar
- `src/lib/hash.ts` - Novo (SHA256)
- `prisma/schema.prisma` - Adicionar campo `hash` em Photo

#### Módulo 3.2: Estrutura de Galeria (3 Colunas)
**Prioridade:** ALTA
**Complexidade:** MÉDIA

**Requisitos:**
- Coluna 1: Thumbnail (URL assinada)
- Coluna 2: Termo de autorização (upload/admin, visualização/download)
- Coluna 3: Link para Sync.com (página interna segura)

**Arquivos:**
- `src/app/galleries/[id]/page.tsx` - Reconstruir completamente
- `src/app/components/GalleryGrid.tsx` - Novo (3 colunas)
- `src/app/components/TermUpload.tsx` - Novo
- `src/app/components/SyncLink.tsx` - Novo

#### Módulo 3.3: Página Interna do Ensaio
**Prioridade:** ALTA
**Complexidade:** MÉDIA

**Requisitos:**
- Grid responsivo de 30 fotos
- Lightbox elegante
- Auto-proteção contra download
- URLs assinadas (1h)

**Arquivos:**
- `src/app/galleries/[id]/preview/page.tsx` - Novo
- `src/app/components/PhotoLightbox.tsx` - Novo
- `src/app/components/PhotoGrid.tsx` - Novo

#### Módulo 3.4: Área da Modelo
**Prioridade:** ALTA
**Complexidade:** MÉDIA

**Requisitos:**
- Foto de perfil editável
- Descrição pessoal
- Mensagem do admin
- Acesso às galerias
- Acesso ao termo
- Acesso ao ensaio Sync.com

**Arquivos:**
- `src/app/model/page.tsx` - Novo
- `src/app/model/profile/page.tsx` - Novo
- `src/app/api/model/profile/route.ts` - Novo

#### Módulo 3.5: Área do Administrador Expandida
**Prioridade:** ALTA
**Complexidade:** MÉDIA

**Requisitos:**
- Lista de usuários
- Lista de galerias
- Criar galeria
- Upload de fotos
- Upload de termo
- Mensagem global (todos/modelos/clientes)
- Descrição personalizada por modelo

**Arquivos:**
- `src/app/admin/dashboard/page.tsx` - Novo
- `src/app/admin/galleries/page.tsx` - Novo
- `src/app/admin/messages/page.tsx` - Novo
- `src/app/api/admin/messages/route.ts` - Novo

### FASE 4: Integração Sync.com

#### Módulo 4: Sync.com Gateway
**Prioridade:** MÉDIA
**Complexidade:** ALTA

**Requisitos:**
- Página `/sync/[galleryId]`
- Apenas modelos e admin
- Revalidação JWT
- Zero-cache
- Anti-hotlinking
- Prevenção copiar/colar URL
- Iframe interno ou janela segura

**Arquivos:**
- `src/app/sync/[galleryId]/page.tsx` - Novo
- `src/lib/sync-gateway.ts` - Novo

### FASE 5: Interface e Navegação

#### Módulo 5: Navegação Moderna
**Prioridade:** ALTA
**Complexidade:** BAIXA

**Requisitos:**
- Navigation com todos os links
- Timer de sessão
- Botão logout
- Grid responsivo
- Botões de retorno
- UI/UX consistente
- Lightbox profissional
- Barra superior fixa

**Arquivos:**
- `src/app/components/Navigation.tsx` - Melhorar
- `src/app/components/Lightbox.tsx` - Novo
- `src/app/globals.css` - Melhorar

### FASE 6: Segurança e LGPD

#### Módulo 6: Segurança Avançada
**Prioridade:** ALTA (já temos bastante)
**Complexidade:** BAIXA

**Requisitos:**
- Revisar e melhorar o que já existe
- Sessões efêmeras (já temos)
- Tokens renováveis (já temos)
- Cookies seguros (já temos)
- Anti-CSRF (já temos)
- URLs assinadas (já temos)
- Anti-hotlinking (adicionar)
- Anti-DDoS básico (adicionar)
- Logs de auditoria (adicionar)

**Arquivos:**
- Revisar todos os arquivos de segurança
- `src/lib/anti-hotlink.ts` - Novo
- `src/lib/ddos-protection.ts` - Novo

#### Módulo 7: LGPD/GDPR
**Prioridade:** ALTA
**Complexidade:** BAIXA

**Requisitos:**
- Rodapé com texto LGPD/GDPR
- Aceites no sign-in
- Link para política

**Arquivos:**
- `src/app/components/LGPDFooter.tsx` - Novo
- `src/app/policy/page.tsx` - Novo
- `src/app/layout.tsx` - Adicionar footer

## 🏗️ Estrutura de Arquivos Proposta

```
src/
├── app/
│   ├── signin/                    # Login principal
│   │   ├── page.tsx              # Email + Senha
│   │   ├── forgot-password/      # Recuperação
│   │   └── 2fa/                  # Dois fatores
│   ├── signin-sms/               # Login SMS
│   │   ├── page.tsx
│   │   └── verify/page.tsx
│   ├── signin-whatsapp/           # Login WhatsApp
│   │   ├── page.tsx
│   │   └── verify/page.tsx
│   ├── signup/                    # Cadastro
│   │   └── page.tsx
│   ├── galleries/                 # Galerias
│   │   ├── page.tsx              # Listagem
│   │   ├── [id]/
│   │   │   ├── page.tsx          # 3 colunas
│   │   │   └── preview/          # Ensaio completo
│   ├── model/                     # Área da modelo
│   │   ├── page.tsx
│   │   └── profile/page.tsx
│   ├── admin/                     # Admin expandido
│   │   ├── dashboard/
│   │   ├── galleries/
│   │   └── messages/
│   ├── sync/                      # Sync.com gateway
│   │   └── [galleryId]/page.tsx
│   └── policy/                    # Política LGPD/GDPR
│       └── page.tsx
├── lib/
│   ├── validators.ts              # Validações (CPF, telefone, etc.)
│   ├── otp.ts                     # OTP generation/validation
│   ├── password-validator.ts     # Validação de senha
│   ├── hash.ts                    # SHA256
│   ├── audit.ts                   # Auditoria
│   ├── notifications.ts           # Email/WhatsApp
│   ├── anti-hotlink.ts            # Anti-hotlinking
│   └── sync-gateway.ts            # Sync.com integration
└── components/
    ├── Navigation.tsx              # Melhorado
    ├── SessionTimer.tsx           # Já existe
    ├── GalleryGrid.tsx            # Novo (3 colunas)
    ├── PhotoLightbox.tsx          # Novo
    ├── TermUpload.tsx             # Novo
    ├── SyncLink.tsx               # Novo
    └── LGPDFooter.tsx             # Novo
```

## 📊 Schema Prisma Proposto

```prisma
model OtpToken {
  id          String   @id @default(cuid())
  phone       String
  cpf         String?
  passport    String?
  email       String
  otp         String   // 6 dígitos
  ip          String
  userAgent   String
  expiresAt   DateTime
  verified    Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  @@index([phone, otp])
  @@index([expiresAt])
}

model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  email       String
  role        Role?
  ip          String
  userAgent   String
  method      String   // SMS/WhatsApp/Password/2FA
  action      String   // login/signup/logout
  sessionTime Int?     // segundos
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([createdAt])
}

model User {
  // ... campos existentes ...
  phone           String?  // Telefone internacional
  cpf             String?  // CPF
  passport        String?  // Passaporte
  birthDate       DateTime? // Data de nascimento
  twoFactorEnabled Boolean @default(false)
  lgpdAccepted    Boolean @default(false)
  gdprAccepted    Boolean @default(false)
  termsAccepted   Boolean @default(false)
  acceptedAt      DateTime?
}

model Photo {
  // ... campos existentes ...
  hash            String?  // SHA256
  termDocumentId String?  // ID do termo de autorização
}

model TermDocument {
  id          String   @id @default(cuid())
  photoId    String   @unique
  key        String   // Path no R2
  mimeType   String
  bytes      Int
  uploadedBy String   // userId do admin
  createdAt  DateTime @default(now())
  
  photo      Photo    @relation(fields: [photoId], references: [id], onDelete: Cascade)
  
  @@index([photoId])
}

model AdminMessage {
  id          String   @id @default(cuid())
  type        String   // "global" | "models" | "clients" | "specific"
  targetUserId String? // Se type === "specific"
  title       String
  content     String
  createdBy   String   // userId do admin
  createdAt   DateTime @default(now())
  
  @@index([type])
  @@index([targetUserId])
}
```

## ⚠️ Pontos que Precisam Esclarecimento

### 1. Provedor SMS/WhatsApp
- **Pergunta:** Qual provedor usar? (Twilio, Zenvia, Meta WhatsApp Cloud API)
- **Sugestão:** Placeholder no MVP, integrar depois

### 2. Sync.com Integration
- **Pergunta:** Como acessar Sync.com? (API, iframe, link direto?)
- **Sugestão:** Gateway seguro com iframe ou janela popup

### 3. Termo de Autorização
- **Pergunta:** Formato do termo? (PDF, imagem, texto?)
- **Sugestão:** PDF ou imagem, armazenado no R2

### 4. Mensagens do Admin
- **Pergunta:** Onde exibir mensagens? (Home, perfil, área da modelo?)
- **Sugestão:** Banner no topo ou seção dedicada

### 5. Área da Modelo
- **Pergunta:** É uma página separada ou parte do perfil?
- **Sugestão:** Página dedicada `/model` com subpáginas

### 6. Upload de Fotos
- **Pergunta:** Admin faz upload direto na galeria ou precisa criar galeria primeiro?
- **Sugestão:** Criar galeria → Upload de fotos → Upload de termo

### 7. Validação de CPF/Passaporte
- **Pergunta:** Validar apenas formato ou também existência real?
- **Sugestão:** Apenas formato no MVP, validação real depois

### 8. Email/WhatsApp de Auditoria
- **Pergunta:** Configurar SMTP/WhatsApp agora ou placeholder?
- **Sugestão:** Placeholder no MVP, integrar depois

## 🚀 Ordem de Execução Recomendada

### Sprint 1: Fundação (Semana 1)
1. Validadores (CPF, telefone, passaporte, email)
2. Schema Prisma (OtpToken, AuditLog, etc.)
3. Login SMS básico (sem envio real)
4. Login WhatsApp básico (sem envio real)

### Sprint 2: Autenticação (Semana 2)
1. 2FA completo
2. Sign-up completo
3. Auditoria básica
4. Logout melhorado

### Sprint 3: Galerias (Semana 3)
1. Upload até 50 MB
2. Hash SHA256
3. Estrutura 3 colunas
4. Upload de termo

### Sprint 4: Interface (Semana 4)
1. Área da modelo
2. Área do admin expandida
3. Lightbox
4. Navegação melhorada

### Sprint 5: Integrações (Semana 5)
1. Sync.com gateway
2. Integração SMS real
3. Integração WhatsApp real
4. Email de auditoria

### Sprint 6: Polimento (Semana 6)
1. LGPD/GDPR
2. Testes completos
3. Documentação
4. Deploy final

## ✅ Próximos Passos Imediatos

1. **Validar plano com você** (esclarecer pontos acima)
2. **Criar estrutura base** (validadores, schema)
3. **Implementar módulo por módulo**
4. **Testar cada módulo antes do próximo**

---

**Status:** Plano criado, aguardando validação e esclarecimentos
**Próximo passo:** Validar plano e esclarecer pontos pendentes

