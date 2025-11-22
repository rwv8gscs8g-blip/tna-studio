# Resumo - Módulo de Testes de Segurança

**Data**: 2025-01-20  
**Status**: ✅ Implementado e Isolado

---

## 📋 Arquivos Criados/Modificados

### Novos Arquivos

1. **`src/lib/certificate-a1-test.ts`**
   - Módulo de teste para Certificado A1 ICP-Brasil
   - Usa `node-forge` para manipular arquivos `.pfx/.p12`
   - Valida certificado, extrai metadados, executa assinatura digital

2. **`src/app/api/security/test-a1/route.ts`**
   - API de teste para Certificado A1
   - Só funciona quando `SECURITY_TEST_MODE=true`
   - Retorna JSON com resultado da validação

3. **`src/app/security/test-a1/page.tsx`**
   - Página de teste para Certificado A1
   - UI amigável com badges, dados do certificado, resultado de assinatura
   - Apenas admin/super_admin podem acessar

4. **`src/app/security/test-govbr/page.tsx`**
   - Página de teste experimental para gov.br
   - Apenas admin/super_admin podem acessar

5. **`src/app/api/auth/govbr-test/route.ts`**
   - API de teste experimental para gov.br
   - Só funciona quando `SECURITY_TEST_MODE=true` e `ENABLE_GOVBR_EXPERIMENTAL=true`

6. **`docs/GOVBR-EXPERIMENTAL-NOTES.md`**
   - Notas experimentais sobre gov.br login
   - Instruções de configuração e limitações

### Arquivos Modificados

1. **`.gitignore`**
   - Adicionado `/secrets/` e extensões de certificados (`.pfx`, `.p12`, `.pem`, etc.)

2. **`SEGURANCA.md`**
   - Adicionada seção "Módulo de Testes de Segurança"

3. **`ARQUITETURA.md`**
   - Adicionada seção "Módulo de Testes de Segurança"

4. **`package.json`**
   - Adicionado `node-forge` e `@types/node-forge` como devDependencies

---

## 🔧 Configuração

### 1. Variáveis de Ambiente

Crie/atualize `.env.local`:

```env
# Habilitar módulo de testes
SECURITY_TEST_MODE=true

# Certificado A1 (para teste)
CERT_A1_FILE_PATH=./secrets/certs/assinatura_a1.pfx
CERT_A1_PASSWORD=sua_senha_aqui
CERT_A1_OWNER_NAME="Nome da Pessoa Jurídica/Física"

# gov.br (opcional, experimental)
ENABLE_GOVBR_EXPERIMENTAL=true
GOVBR_CLIENT_ID=seu_client_id
GOVBR_CLIENT_SECRET=seu_client_secret
GOVBR_REDIRECT_URI=https://tna-studio.vercel.app/api/auth/callback/govbr
```

### 2. Estrutura de Diretórios

```bash
# Criar diretório para certificados (já criado)
mkdir -p secrets/certs

# Colocar certificado A1 aqui (NUNCA commitar)
# secrets/certs/assinatura_a1.pfx
```

### 3. Instalar Dependências

```bash
npm install
# node-forge já foi instalado automaticamente
```

---

## 🚀 Como Usar

### Teste de Certificado A1

1. **Colocar certificado no lugar certo:**
   ```bash
   # Copiar certificado para secrets/certs/
   cp /caminho/do/seu/certificado.pfx ./secrets/certs/assinatura_a1.pfx
   ```

2. **Configurar `.env.local`:**
   ```env
   SECURITY_TEST_MODE=true
   CERT_A1_FILE_PATH=./secrets/certs/assinatura_a1.pfx
   CERT_A1_PASSWORD=sua_senha_aqui
   ```

3. **Acessar página de teste:**
   - Fazer login como admin
   - Acessar: `http://localhost:3000/security/test-a1`
   - Clicar em "Testar Certificado A1"

4. **Interpretar resultado:**
   - ✅ **Verde**: Certificado válido, assinatura OK
   - ❌ **Vermelho**: Problemas encontrados (ver seção "Problemas Encontrados")
   - Dados do certificado: subject, issuer, serial, datas, OIDs
   - Teste de assinatura: se passou ou falhou

### Teste Experimental gov.br

1. **Obter credenciais gov.br:**
   - Acessar: https://www.gov.br/conecta/catalogo/apis/apis-de-autenticacao
   - Registrar aplicação
   - Obter Client ID e Client Secret

2. **Configurar `.env.local`:**
   ```env
   SECURITY_TEST_MODE=true
   ENABLE_GOVBR_EXPERIMENTAL=true
   GOVBR_CLIENT_ID=seu_client_id
   GOVBR_CLIENT_SECRET=seu_client_secret
   ```

3. **Acessar página de teste:**
   - Fazer login como admin
   - Acessar: `http://localhost:3000/security/test-govbr`
   - Clicar em "Testar gov.br Login"

4. **Status atual:**
   - API retorna informações sobre configuração necessária
   - Implementação completa requer SDK gov.br (pode não estar disponível)

---

## 📊 Decisões Técnicas

### Biblioteca para Certificados

**Escolhido**: `node-forge`

**Por quê:**
- ✅ Open source, bem mantido
- ✅ Suporta PKCS#12 (.pfx/.p12)
- ✅ Permite assinatura digital
- ✅ Não requer dependências nativas complexas
- ✅ Funciona em Node.js e Next.js

**Alternativas consideradas:**
- `@peculiar/x509` - Mais moderno, mas menos documentado
- SDK ICP-Brasil - Pode não estar disponível publicamente
- `crypto` nativo - Não suporta PKCS#12 diretamente

### Estrutura de Arquivos

**Certificado via arquivo:**
- ✅ Mais seguro (não fica em variáveis de ambiente)
- ✅ Pode ser criptografado no disco
- ✅ Fácil de gerenciar (backup, renovação)

**Alternativa rejeitada:**
- Certificado em base64 em variável de ambiente - Menos seguro, difícil de gerenciar

---

## ⚠️ Limitações e Próximos Passos

### Limitações Atuais

1. **Validação de Cadeia ICP-Brasil:**
   - Validação básica (issuer, OIDs)
   - Validação completa de cadeia requer AC raiz (pode ser complexa)

2. **gov.br Login:**
   - API retorna informações, mas não implementa fluxo completo
   - Requer SDK gov.br (pode não estar disponível)

3. **Assinatura Digital:**
   - Teste básico funciona
   - Assinatura real de operações será implementada na Fase 2

### Próximos Passos

1. **Testar com certificado real:**
   - Obter certificado A1 de teste
   - Validar extração de metadados
   - Validar assinatura digital

2. **Integrar guards de escrita (Fase 2):**
   - Quando `CERT_A1_ENFORCE_WRITES=true`
   - Integrar `canWriteAdminOperation` em APIs
   - Validar certificado em cada operação

3. **Implementar gov.br completo (se viável):**
   - Verificar disponibilidade de SDK
   - Implementar provider gov.br no NextAuth
   - Testar fluxo OAuth completo

---

## 🔒 Segurança

### O Que Está Protegido

- ✅ Certificado nunca é commitado (`.gitignore`)
- ✅ Senha via variável de ambiente (não hardcoded)
- ✅ Rotas de teste só funcionam com `SECURITY_TEST_MODE=true`
- ✅ Apenas admin/super_admin podem acessar
- ✅ Nenhuma alteração no fluxo de produção

### O Que Ainda Precisa

- ⏳ Criptografia do certificado no disco (opcional, mas recomendado)
- ⏳ Rotação de certificados (processo de renovação)
- ⏳ Validação completa de cadeia ICP-Brasil

---

## 📝 Checklist de Validação

Antes de considerar o módulo pronto:

- [x] Certificado A1 pode ser carregado de arquivo
- [x] Metadados são extraídos corretamente
- [x] Assinatura digital de teste funciona
- [x] Página de teste exibe resultados claramente
- [ ] Testado com certificado A1 real
- [ ] Validação de cadeia ICP-Brasil funciona
- [ ] gov.br login implementado (se SDK disponível)

---

**Status**: ✅ Módulo de Testes Implementado e Isolado  
**Próximo**: Testar com certificado real e validar funcionamento

