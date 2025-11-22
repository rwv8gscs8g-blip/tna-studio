# Debug - Erro "Configuration" no Login

**Data**: 2025-01-20  
**Status**: 🔍 Em Investigação

---

## 🔍 Problema

Todos os usuários estão recebendo erro "Configuration" ao tentar fazer login, tanto no Chrome quanto no Safari.

---

## ✅ Correções Aplicadas

### 1. Logs Adicionados

Adicionados logs detalhados no `authorize` para identificar onde está falhando:

- Log quando credenciais estão vazias
- Log quando email é recebido
- Log quando senha está incorreta
- Log quando login é bem-sucedido
- Log quando há erro no processo

### 2. Tratamento de Erro Melhorado

- Try-catch completo no `authorize`
- Logs de erro mais detalhados

### 3. Simplificação da Inicialização

- Removido try-catch desnecessário na inicialização do NextAuth
- Inicialização direta (padrão do NextAuth v5)

---

## 🚀 Próximos Passos

### 1. Reiniciar Servidor

```bash
cd /Users/macbookpro/Projetos/tna-studio

# Parar servidor (Ctrl+C)
# Limpar cache
rm -rf .next node_modules/.cache

# Reiniciar
npm run dev
```

### 2. Testar Login e Verificar Logs

Acesse: http://localhost:3000/signin

**Credenciais**:
- `admin@tna.studio` / `Admin@2025!`
- `client1@tna.studio` / `Client1@2025!`

**No terminal do servidor, procure por**:
- `[Auth] Tentativa de login para: ...`
- `[Auth] Login bem-sucedido para: ...`
- `[Auth] Erro no authorize: ...`
- `[Auth] Retornando dados do usuário: ...`

### 3. Verificar Erros Específicos

Se aparecer erro "Configuration", verifique nos logs:
- Se o `authorize` está sendo chamado
- Se há algum erro antes do retorno
- Se o retorno está no formato correto

---

## 🔍 Possíveis Causas

1. **Provider Credentials mal configurado**
   - Verificar se o nome está correto: `"credentials"`
   - Verificar se o `authorize` está retornando o formato correto

2. **Erro no banco de dados**
   - Verificar se a query está funcionando
   - Verificar se os campos existem

3. **Problema com NextAuth v5 beta**
   - Versão beta pode ter bugs
   - Verificar se há atualizações disponíveis

---

## 📝 Logs Esperados

**Login bem-sucedido**:
```
[Auth] Tentativa de login para: admin@tna.studio
[Auth] Login bem-sucedido para: admin@tna.studio (role: ADMIN)
[Auth] Retornando dados do usuário: { id: '...', email: 'admin@tna.studio', role: 'ADMIN' }
```

**Login falhado**:
```
[Auth] Tentativa de login para: admin@tna.studio
[Auth] Senha incorreta para: admin@tna.studio
```

**Erro**:
```
[Auth] Tentativa de login para: admin@tna.studio
[Auth] Erro no authorize: [detalhes do erro]
```

---

**Após reiniciar, teste o login e envie os logs do servidor!**

