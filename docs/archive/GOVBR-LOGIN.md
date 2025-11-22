# Integração gov.br Login - Análise e Recomendações

## 📋 Análise Técnica

### gov.br Login (OAuth 2.0)

**Características:**
- ✅ **Padrão brasileiro**: Integração oficial do governo
- ✅ **Validade jurídica**: Reconhecido pelo governo brasileiro
- ✅ **Biometria**: Suporta biometria via gov.br (Touch ID / Face ID no Mac)
- ✅ **Não-repúdio**: Parcial (gov.br valida identidade)
- ⚠️ **Limitação**: Não fornece assinatura digital (diferente de certificado A1)

### Comparação: Certificado A1 vs gov.br Login vs WebAuthn

| Aspecto | Certificado A1 | gov.br Login | WebAuthn |
|---------|----------------|-------------|----------|
| **Validade Jurídica** | ✅ Total (Lei 14.063/2020) | ✅ Parcial | ❌ Não |
| **Não-Repúdio** | ✅ Sim (ICP-Brasil) | ⚠️ Parcial | ❌ Não |
| **Assinatura Digital** | ✅ Sim | ❌ Não | ❌ Não |
| **Cadeia ICP** | ✅ Sim | ❌ Não | ❌ Não |
| **Biometria** | ⚠️ Via token | ✅ Sim | ✅ Sim |
| **Complexidade** | Alta | Média | Baixa |
| **Uso Recomendado** | Escrita admin (obrigatório) | Login (opcional) | 2FA (opcional) |

## 🎯 Recomendação de Uso

### Fluxo Híbrido Recomendado

```
┌─────────────────────────────────────────┐
│ Login (Escolha do Usuário)               │
├─────────────────────────────────────────┤
│ 1. gov.br OAuth (recomendado)            │
│    - Biometria nativa (Mac)              │
│    - Validade jurídica parcial           │
│    - Melhor UX                           │
│                                          │
│ 2. WebAuthn (alternativa)               │
│    - Biometria nativa (Mac)              │
│    - Mais simples                        │
│                                          │
│ 3. Email + Senha (atual)                │
│    - Fallback                            │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ Operação Admin (Escrita)                │
├─────────────────────────────────────────┤
│ Certificado A1 ICP-Brasil (OBRIGATÓRIO)│
│ - Validação jurídica total              │
│ - Assinatura digital                    │
│ - Não-repúdio                           │
└─────────────────────────────────────────┘
```

### Conclusão

**Para Login:**
- ✅ **gov.br OAuth** - Recomendado (biometria, validade jurídica parcial, melhor UX)
- ✅ **WebAuthn** - Alternativa (biometria, mais simples)
- ✅ **Email + Senha** - Fallback (atual)

**Para Escrita Admin:**
- ✅ **Certificado A1** - Obrigatório (validação jurídica total, assinatura digital, não-repúdio)
- ❌ **gov.br Login** - Não substitui A1 (não fornece assinatura digital)
- ❌ **WebAuthn** - Não substitui A1 (não tem validação jurídica)

## 🔧 Implementação

### Passo 1: Configurar gov.br OAuth

**Documentação oficial:**
- https://www.gov.br/conecta/catalogo/apis/apis-de-autenticacao

**Variáveis de ambiente necessárias:**
```env
GOVBR_CLIENT_ID="seu_client_id"
GOVBR_CLIENT_SECRET="seu_client_secret"
GOVBR_REDIRECT_URI="https://tna-studio.vercel.app/api/auth/callback/govbr"
```

### Passo 2: Integrar com NextAuth

**Adicionar provider gov.br:**
```typescript
// src/auth.ts
import GovBR from "next-auth/providers/govbr"; // Se disponível
// Ou implementar provider customizado

providers: [
  GovBR({
    clientId: process.env.GOVBR_CLIENT_ID,
    clientSecret: process.env.GOVBR_CLIENT_SECRET,
  }),
  // ... outros providers
]
```

### Passo 3: Manter Certificado A1 para Escrita

**Importante**: Mesmo com gov.br login, Certificado A1 permanece obrigatório para operações administrativas de escrita.

**Fluxo:**
1. Login via gov.br (biometria)
2. Tentativa de operação admin
3. Validação de Certificado A1 (obrigatória)
4. Execução da operação (se todas as 6 camadas passarem)

## 📊 Status Atual

**Implementado:**
- ✅ Email + Senha (atual)
- ✅ Certificado A1 (obrigatório para escrita)

**Pendente:**
- ⏳ gov.br OAuth (opcional para login)
- ⏳ WebAuthn (opcional para 2FA)

## 🚀 Próximos Passos

1. **Avaliar disponibilidade de SDK gov.br para Next.js**
2. **Implementar provider gov.br no NextAuth**
3. **Testar integração com biometria Mac**
4. **Documentar fluxo completo**

---

**Última atualização**: 2025-01-20  
**Status**: Análise completa, aguardando decisão de implementação

