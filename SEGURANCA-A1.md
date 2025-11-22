# Segurança - Certificado Digital A1 ICP-Brasil

**Versão:** 1.0  
**Data:** 2025-11-21

## Visão Geral

O Certificado Digital A1 ICP-Brasil é obrigatório para todas as operações de escrita realizadas pelo ARQUITETO. Ele garante validade jurídica, não-repúdio e rastreabilidade completa das ações administrativas.

## Configuração

### Variáveis de Ambiente (`.env.local`):
```env
CERT_A1_FILE_PATH=./secrets/certs/assinatura_a1.pfx
CERT_A1_PASSWORD="senha_do_certificado"
CERT_A1_ENFORCE_WRITES=true
```

### Como Obter o Certificado:
1. Obtenha um certificado A1 ICP-Brasil de uma Autoridade Certificadora (AC) credenciada
2. Exporte o certificado no formato PKCS#12 (.pfx ou .p12)
3. Coloque o arquivo em `secrets/certs/assinatura_a1.pfx`
4. Configure a senha em `CERT_A1_PASSWORD`

**IMPORTANTE:** Não commite a senha do certificado no repositório!

## Uso no Sistema

### 1. Login do ARQUITETO
- O certificado pode ser usado para login (provider `"certificate"` no NextAuth)
- O sistema lê o certificado do servidor e valida
- Busca o usuário ARQUITETO associado ao certificado pelo serial number

### 2. Operações de Escrita
- **Todas** as operações de escrita exigem validação do certificado A1
- A validação é feita antes de cada operação através do `write-guard-arquiteto`
- Se o certificado for inválido, a operação é bloqueada (403)

### 3. Validações Realizadas
- ✅ Cadeia ICP-Brasil (issuer)
- ✅ Validade (notBefore / notAfter)
- ✅ Thumbprint (SHA-1)
- ✅ OIDs obrigatórios
- ✅ Teste de assinatura digital

## Modo de Teste vs Produção

### `CERT_A1_ENFORCE_WRITES=false`
- Modo de teste/desenvolvimento
- Certificado não é obrigatório
- Operações são permitidas sem certificado (com aviso)

### `CERT_A1_ENFORCE_WRITES=true`
- Modo de produção
- Certificado é **obrigatório**
- Operações sem certificado válido são **bloqueadas** (hard fail)

## Gerenciamento do Certificado

### SUPER_ADMIN pode:
- Fazer upload de novo certificado A1 via `/api/super-admin/certificates/upload`
- Trocar o certificado válido no sistema
- **Não pode** fazer outras operações de escrita

### Registro no Banco:
- O certificado é registrado em `AdminCertificate`
- Associado ao usuário ARQUITETO pelo `userId`
- Armazenado com hash e versão criptografada

## Referências Legais

- **Lei 14.063/2020:** Dispositivos de segurança da informação
- **MP 2.200-2/2001:** Infraestrutura de Chaves Públicas Brasileira (ICP-Brasil)
- **ICP-Brasil:** https://www.gov.br/iti/pt-br/assuntos/repositorio/icp-brasil

## Segurança

### Boas Práticas:
1. ✅ Não commite senhas ou certificados no repositório
2. ✅ Use variáveis de ambiente para configuração sensível
3. ✅ Mantenha o certificado em local seguro (`secrets/certs/`)
4. ✅ Renove o certificado antes de expirar
5. ✅ Valide certificado em cada operação (não cacheie validação)

### Em Produção:
- Configure `CERT_A1_ENFORCE_WRITES=true`
- Certifique-se de que o certificado está válido e não expirado
- Monitore tentativas de operações bloqueadas (logs em `AdminOperation`)

