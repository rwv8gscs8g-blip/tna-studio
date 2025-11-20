# Instruções para Limpeza de Cache e Cookies

## Problema: Usuário permanece logado após reiniciar servidor

Se você está vendo que o usuário permanece logado mesmo após reiniciar o servidor, isso indica que há cookies antigos no navegador. Siga estas instruções:

## Solução Automática (Recomendada)

O sistema agora detecta automaticamente tokens de builds antigos e os invalida. Se você ainda vê o problema:

1. **Reinicie o servidor Next.js**
2. **Acesse qualquer página protegida** (ex: `/galleries`)
3. O sistema deve **automaticamente redirecionar para `/signin?clearCookies=1`**
4. Os cookies serão limpos automaticamente

## Solução Manual (Se necessário)

### No Navegador

#### Chrome/Edge:
1. Pressione `F12` para abrir DevTools
2. Vá em **Application** > **Storage**
3. Clique em **Clear site data**
4. Ou manualmente em **Cookies**:
   - Delete `next-auth.session-token`
   - Delete `__Secure-next-auth.session-token`
   - Delete qualquer cookie relacionado

#### Safari:
1. Pressione `Cmd + Option + E` para limpar cache
2. Ou: **Safari** > **Preferências** > **Privacidade** > **Gerenciar Dados do Site**
3. Remova cookies de `localhost:3000`

#### Firefox:
1. Pressione `Ctrl+Shift+Delete` (Windows) ou `Cmd+Shift+Delete` (Mac)
2. Selecione **Cookies** e **Cache**
3. Clique em **Limpar Agora**

### Via Terminal (Limpeza completa)

```bash
# Limpa cache do Next.js
rm -rf .next

# Reinicia o servidor
npm run dev
```

## Verificação

Após limpar cookies:

1. Acesse `http://localhost:3000`
2. Você deve ser **redirecionado para `/signin`**
3. Faça login novamente
4. A sessão deve expirar em **5 minutos** (não mais 470 minutos)

## Como o Sistema Funciona Agora

- **Build Timestamp**: Cada restart do servidor gera um novo timestamp
- **Validação Automática**: Tokens criados antes do build atual são automaticamente rejeitados
- **Limpeza Automática**: O middleware detecta tokens inválidos e limpa cookies automaticamente
- **Sessão de 5 minutos**: Todos os tokens expiram em exatamente 5 minutos (300 segundos)

## Logs para Monitorar

Verifique os logs do servidor para confirmar:

```
[BuildVersion] Build iniciado em [timestamp] (versão: build-[timestamp])
[Auth] Token REJEITADO - build antigo
[Middleware] Sessão inválida detectada - cookies limpos e redirecionando para login
```

Se você não vê esses logs, o sistema pode não estar detectando tokens antigos corretamente.

