# Guia de Teste - Login por Credenciais (Email + Senha)

## ✅ Alterações Realizadas

### 1. Provider de Certificado A1 Desativado
- ✅ Removido o provider `certificate` do array de providers em `src/auth.ts`
- ✅ Comentados os imports relacionados ao certificado A1
- ✅ Removida toda lógica de login por certificado durante autenticação

### 2. Provider de Credenciais Verificado
- ✅ Provider `credentials` está ativo e funcional
- ✅ Logs de debug implementados com prefixo `[auth-debug]`
- ✅ Fluxo simplificado: email → senha → validação → retorno

### 3. Página de Signin Verificada
- ✅ Chama apenas `signIn("credentials", { email, password })`
- ✅ Não há referências a certificado A1 na página

## 📋 Passo a Passo para Testar

### 1. Preparação

```bash
# Navegue até o diretório do projeto
cd /Users/macbookpro/Projetos/tna-studio

# Verifique o banco de dados
npm run debug:db
```

**Saída esperada:**
```
[debug-db] DATABASE_URL: postgresql://neondb_owner:****@ep-raspy-firefly-acqce8tz-pooler.sa-east-1.aws.neon.tech/neondb...
[debug-db] users: [ { email: '[redacted-email]', role: 'ARQUITETO' } ]
```

### 2. Iniciar Servidor de Desenvolvimento

```bash
# Inicie o servidor
npm run dev
```

**Aguardar até ver:**
```
✓ Ready in Xs
○ Local: http://localhost:3000
○ Network: use --host to expose
```

### 3. Acessar Página de Login

Abra no navegador:
- **URL:** `http://localhost:3000/signin`
- Se estiver usando outra porta, verifique o terminal (ex: `http://localhost:3003/signin`)

### 4. Fazer Login

**Credenciais:**
- **Email:** `[redacted-email]`
- **Senha:** `[redacted-password]`

### 5. Verificar Logs no Terminal

**Logs esperados (em desenvolvimento):**

```
[auth-debug] DATABASE_URL: postgresql://neondb_owner:****@ep-raspy-firefly-acqce8tz-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
[auth-debug] credentials raw: { email: '[redacted-email]', password: '***' }
[auth-debug] normalized email: [redacted-email]
[auth-debug] user from DB: {
  id: 'cmi9fbjpb0000pninqqwucy0b',
  email: '[redacted-email]',
  name: 'Luís Maurício Junqueira Zanin',
  role: 'ARQUITETO',
  passwordHash: '***'
}
[auth-debug] password valid? true
[auth-debug] role: ARQUITETO
[auth-debug] login success for [redacted-email]
[Auth] Novo token criado para userId=cmi9fbjp... role=ARQUITETO (expira em ..., 3600s)
```

### 6. Confirmar que NÃO Aparecem Mais

❌ **NÃO deve aparecer:**
- Queries em `AdminCertificate`
- Mensagem `[Auth] Login por certificado falhou: Certificado não está associado a nenhum usuário ativo`
- Erro `[auth][error] CredentialsSignin` (sem razão aparente)

### 7. Resultado Esperado

✅ **Login bem-sucedido:**
- Redirecionamento para `/` (home)
- Sessão criada com role `ARQUITETO`
- Token válido por 1 hora (3600 segundos)

## 🔍 Troubleshooting

### Se os logs `[auth-debug]` não aparecerem:

1. Verifique que `NODE_ENV=development` no `.env.local`
2. Verifique que o servidor está rodando em modo desenvolvimento (`npm run dev`)
3. Verifique os logs do NextAuth no console

### Se aparecer erro `CredentialsSignin`:

1. Verifique os logs `[auth-debug]` para identificar onde está falhando:
   - `[auth-debug] missing email or password` → Credenciais não estão sendo enviadas
   - `[auth-debug] user not found or no passwordHash` → Usuário não existe no banco
   - `[auth-debug] password valid? false` → Senha incorreta
   - `[auth-debug] invalid role` → Role não é ARQUITETO

### Se ainda aparecer mensagem de certificado:

1. Verifique que o provider `certificate` foi removido de `src/auth.ts`
2. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)
3. Reinicie o servidor (`npm run dev`)

## 📁 Arquivos Modificados

1. ✅ `src/auth.ts`
   - Removido provider `certificate`
   - Comentados imports de certificado
   - Mantido apenas provider `credentials`

2. ✅ `src/app/signin/page.tsx`
   - Já estava correto (chamando apenas `signIn("credentials", ...)`)

3. ✅ `src/app/api/auth/[...nextauth]/route.ts`
   - Já estava correto (importando de `@/auth`)

## ✅ Confirmação Final

- **Provider ativo:** Apenas `credentials` (email + senha)
- **Provider desativado:** `certificate` (certificado A1)
- **Fluxo de login:** Email → Senha → Validação → Sessão
- **Logs de debug:** Ativos com prefixo `[auth-debug]`
- **Sem certificado:** Nenhuma query em `AdminCertificate` durante login

**Sistema pronto para teste!** 🚀

