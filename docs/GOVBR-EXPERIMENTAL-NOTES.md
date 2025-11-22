# Notas Experimentais - gov.br Login

## ⚠️ Status: EXPERIMENTAL

Este módulo é **experimental** e serve apenas para avaliar viabilidade técnica e jurídica futura.

**NÃO substitui:**
- ❌ Certificado A1 (obrigatório para escrita admin)
- ❌ Login principal atual (Email + Senha)

**Objetivo:**
- ✅ Avaliar viabilidade técnica de integração gov.br
- ✅ Avaliar viabilidade jurídica como complemento (nunca substituto)
- ✅ Testar fluxo OAuth 2.0 do gov.br
- ✅ Validar claims retornados (CPF, nome, nível de segurança)

## 🔧 Configuração

### Variáveis de Ambiente Necessárias

```env
# Habilitar módulo experimental
SECURITY_TEST_MODE=true
ENABLE_GOVBR_EXPERIMENTAL=true

# Credenciais gov.br (obter em https://www.gov.br/conecta)
GOVBR_CLIENT_ID="seu_client_id"
GOVBR_CLIENT_SECRET="seu_client_secret"
GOVBR_REDIRECT_URI="https://tna-studio.vercel.app/api/auth/callback/govbr"
```

### Como Obter Credenciais

1. Acesse: https://www.gov.br/conecta/catalogo/apis/apis-de-autenticacao
2. Registre sua aplicação
3. Obtenha Client ID e Client Secret
4. Configure Redirect URI: `https://tna-studio.vercel.app/api/auth/callback/govbr`

## 📋 Fluxo de Teste

1. Acesse `/security/test-govbr` (apenas admin/super_admin)
2. Clique em "Testar gov.br Login"
3. Será redirecionado para gov.br para autenticação
4. Após autenticação, retorna para callback
5. Dados retornados são exibidos na página (sem gravar nada)

## 🔍 Claims Esperados

O gov.br deve retornar:
- `sub` - Identificador único do usuário
- `cpf` - CPF do usuário
- `nome` - Nome completo
- `nivel` - Nível de segurança (nível 1, 2 ou 3)
- Outros claims conforme documentação oficial

## ⚠️ Limitações Conhecidas

1. **Não fornece assinatura digital** - Diferente de Certificado A1
2. **Não-repúdio parcial** - gov.br valida identidade, mas não assina operações
3. **Dependência externa** - Requer serviço gov.br disponível
4. **SDK não oficial** - Pode não haver SDK oficial para Next.js

## 🚀 Próximos Passos

1. Verificar disponibilidade de SDK gov.br para Next.js
2. Implementar provider gov.br no NextAuth (se SDK disponível)
3. Testar fluxo OAuth completo
4. Validar claims retornados
5. Documentar viabilidade técnica e jurídica

## 📚 Referências

- **Documentação gov.br**: https://www.gov.br/conecta/catalogo/apis/apis-de-autenticacao
- **OAuth 2.0**: https://oauth.net/2/
- **NextAuth Providers**: https://next-auth.js.org/configuration/providers

---

**Última atualização**: 2025-01-20  
**Status**: Experimental - Aguardando credenciais e SDK

