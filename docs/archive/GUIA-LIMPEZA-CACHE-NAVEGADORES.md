# Guia de Limpeza de Cache - Navegadores

Este guia explica como limpar o cache e cookies em diferentes navegadores para resolver problemas de logout e sessão.

---

## 🌐 Google Chrome

### Método 1: Limpeza Rápida (Recomendado)
1. Pressione `Cmd + Shift + Delete` (Mac) ou `Ctrl + Shift + Delete` (Windows/Linux)
2. Selecione:
   - ✅ **Cookies e outros dados de sites**
   - ✅ **Imagens e arquivos em cache**
3. Período: **Última hora** ou **Todo o período**
4. Clique em **Limpar dados**

### Método 2: Limpeza Específica do Site
1. Clique no ícone de cadeado 🔒 na barra de endereços
2. Clique em **Cookies e dados do site**
3. Clique em **Gerenciar dados do site**
4. Procure por `localhost` ou `tna-studio`
5. Clique em **Remover** ou **Limpar tudo**

### Método 3: Modo Anônimo
1. Pressione `Cmd + Shift + N` (Mac) ou `Ctrl + Shift + N` (Windows/Linux)
2. Acesse `http://localhost:3000`
3. Teste o login

---

## 🍎 Safari (macOS)

### Método 1: Limpeza de Cache e Cookies
1. Menu **Safari** → **Configurações** (ou `Cmd + ,`)
2. Aba **Privacidade**
3. Clique em **Gerenciar Dados de Sites...**
4. Procure por `localhost` ou `tna-studio`
5. Selecione e clique em **Remover**
6. Clique em **Concluído**

### Método 2: Limpeza Completa
1. Menu **Safari** → **Limpar Histórico...**
2. Selecione **Todo o histórico**
3. Clique em **Limpar Histórico**
4. Reinicie o Safari

### Método 3: Desabilitar Cache (Desenvolvimento)
1. Menu **Desenvolver** → **Desabilitar Caches**
   - Se não ver o menu "Desenvolver":
     - Menu **Safari** → **Configurações** → **Avançado**
     - Marque **Mostrar menu Desenvolver na barra de menus**

### Método 4: Modo Privado
1. Menu **Arquivo** → **Nova Janela Privada** (ou `Cmd + Shift + N`)
2. Acesse `http://localhost:3000`
3. Teste o login

---

## 🔵 Microsoft Edge

### Método 1: Limpeza Rápida
1. Pressione `Cmd + Shift + Delete` (Mac) ou `Ctrl + Shift + Delete` (Windows)
2. Selecione:
   - ✅ **Cookies e outros dados de sites**
   - ✅ **Imagens e arquivos em cache**
3. Período: **Última hora** ou **Todo o período**
4. Clique em **Limpar agora**

### Método 2: Modo InPrivate
1. Pressione `Cmd + Shift + N` (Mac) ou `Ctrl + Shift + N` (Windows)
2. Acesse `http://localhost:3000`
3. Teste o login

---

## 🦊 Mozilla Firefox

### Método 1: Limpeza de Cookies e Cache
1. Pressione `Cmd + Shift + Delete` (Mac) ou `Ctrl + Shift + Delete` (Windows/Linux)
2. Selecione:
   - ✅ **Cookies**
   - ✅ **Cache**
3. Período: **Última hora** ou **Tudo**
4. Clique em **Limpar agora**

### Método 2: Modo Privado
1. Pressione `Cmd + Shift + P` (Mac) ou `Ctrl + Shift + P` (Windows/Linux)
2. Acesse `http://localhost:3000`
3. Teste o login

---

## 🔧 Limpeza via Terminal (Todos os Navegadores)

### Limpar Cache do Next.js
```bash
# No diretório do projeto
rm -rf .next
rm -rf node_modules/.cache
```

### Limpar Cookies via Terminal (Chrome/Edge)
```bash
# macOS
rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Cookies
rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Cache

# Linux
rm -rf ~/.config/google-chrome/Default/Cookies
rm -rf ~/.config/google-chrome/Default/Cache
```

---

## 🚨 Solução Rápida para Problema de Logout

Se após clicar em "Sair" o botão "Entrar" não funciona:

1. **Limpe o cache do navegador** (use um dos métodos acima)
2. **Feche todas as abas** do site
3. **Feche o navegador completamente**
4. **Reabra o navegador**
5. **Acesse `http://localhost:3000` novamente**

---

## 📝 Verificação

Após limpar o cache, verifique:

1. ✅ Acesse `http://localhost:3000`
2. ✅ Clique em "Entrar"
3. ✅ Faça login com suas credenciais
4. ✅ Verifique se a sessão está funcionando
5. ✅ Clique em "Sair"
6. ✅ Verifique se redireciona para a página inicial
7. ✅ Clique em "Entrar" novamente
8. ✅ Verifique se o login funciona

---

## 💡 Dica para Desenvolvimento

Durante o desenvolvimento, recomenda-se usar **Modo Anônimo/Privado** para evitar problemas de cache:

- **Chrome/Edge**: `Cmd/Ctrl + Shift + N`
- **Safari**: `Cmd + Shift + N`
- **Firefox**: `Cmd/Ctrl + Shift + P`

---

## 🔍 Debug Avançado

### Verificar Cookies no Console
Abra o Console do navegador (F12) e execute:

```javascript
// Listar todos os cookies
document.cookie.split(';').forEach(c => console.log(c.trim()));

// Limpar todos os cookies
document.cookie.split(';').forEach(c => {
  const name = c.split('=')[0].trim();
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
});
```

### Verificar SessionStorage e LocalStorage
```javascript
// Limpar sessionStorage
sessionStorage.clear();

// Limpar localStorage
localStorage.clear();
```

---

**Última atualização**: 2025-01-20

