# Comandos Finais - Validação Completa

**Data**: 2025-01-20

---

## 🚀 Passos para Validar Todas as Correções

### 1. Resetar Banco Completo

```bash
cd /Users/macbookpro/Projetos/tna-studio

# Resetar banco (apaga TUDO: usuários, galerias, fotos, etc.)
./scripts/reset-database-completo.sh
# Pressione Enter quando solicitado
```

**Verificar**:
- ✅ Banco resetado (sem galerias, sem dados antigos)
- ✅ 5 usuários criados pelo seed

### 2. Limpar Cache e Reiniciar

```bash
# Limpar cache
rm -rf .next node_modules/.cache

# Reiniciar servidor
npm run dev
```

### 3. Testar Login em Todos os Navegadores

**Credenciais**:
- `admin@tna.studio` / `Admin@2025!` (ADMIN)
- `super@tna.studio` / `Super@2025!` (SUPER_ADMIN)
- `model1@tna.studio` / `Model1@2025!` (MODEL)
- `client1@tna.studio` / `Client1@2025!` (CLIENT)
- `[redacted-email]` / `[redacted-password]` (SUPER_ADMIN)

**Navegadores**:
- ✅ Safari
- ✅ Chrome
- ✅ Atlas (após limpar dados)

### 4. Verificar Logout

**Em cada navegador**:
1. Fazer login
2. Clicar em "Sair"
3. Verificar que não fica travado na tela de login
4. Verificar que cookies foram limpos

### 5. Verificar Sessão

**Teste 1 - Tempo de Sessão**:
1. Fazer login como admin
2. Verificar que mostra "10:00" (10 minutos)
3. Aguardar alguns segundos
4. Verificar que diminui corretamente

**Teste 2 - Não Renovar no Refresh**:
1. Fazer login como admin
2. Verificar tempo restante (ex: 09:30)
3. Atualizar página (F5 ou Cmd+R)
4. Verificar que tempo NÃO volta para 10:00
5. Verificar que mantém tempo original (ex: 09:29)

**Teste 3 - Tempo do Servidor**:
1. Fazer login
2. Verificar tempo mostrado
3. Aguardar 1 minuto
4. Verificar que tempo diminui corretamente
5. Se houver divergência, o servidor controla (session.expires)

### 6. Verificar Painel Admin

**URL**: http://localhost:3000/admin/users

**Verificações**:
- ✅ Mostra 5 usuários (não apenas 3)
- ✅ Inclui `super@tna.studio` (SUPER_ADMIN)
- ✅ Inclui `[redacted-email]` (SUPER_ADMIN)
- ✅ Inclui `admin@tna.studio` (ADMIN)
- ✅ Inclui `model1@tna.studio` (MODEL)
- ✅ Inclui `client1@tna.studio` (CLIENT)

### 7. Verificar Edição de Usuário

**Teste**:
1. Clicar em "Editar" em qualquer usuário
2. Verificar que modal abre
3. Verificar que dados são carregados (não mostra "Erro ao carregar")
4. Verificar que campos estão pré-preenchidos
5. Verificar que placeholders são genéricos (não dados do mauriciozanin)

**Placeholders esperados**:
- Telefone: `+5561999999999` (não `[redacted-phone]`)
- CPF: `00000000000` (não `[redacted-cpf]`)

### 8. Verificar Relatórios

**URL**: http://localhost:3000/admin/reports

**Verificações**:
- ✅ Mostra até 30 usuários
- ✅ Busca por nome funciona
- ✅ Busca por email funciona
- ✅ Busca por CPF funciona
- ✅ Filtro por perfil funciona (todos, admin, super_admin, model, client)
- ✅ Mostra nome, email, CPF, perfil, idade, data criação

### 9. Verificar Perfil - CLIENT não pode alterar CPF

**Teste**:
1. Fazer login como `client1@tna.studio`
2. Ir para `/profile`
3. Verificar que campo CPF está desabilitado
4. Verificar mensagem: "Clientes não podem alterar o CPF..."
5. Tentar alterar outros campos (nome, telefone, senha)
6. Verificar que funciona

### 10. Verificar Certificado A1

**Teste**:
1. Fazer login como admin
2. Tentar criar usuário (`teste@local.tes`)
3. Verificar que pede certificado A1
4. Verificar que valida certificado
5. Verificar que cria usuário após validação

**Teste Edição**:
1. Fazer login como admin
2. Tentar editar usuário
3. Verificar que pede certificado A1
4. Verificar que valida certificado
5. Verificar que salva após validação

### 11. Verificar Reset Completo

**Antes do reset**:
- Verificar se há galerias no banco

**Após reset**:
- ✅ Banco zerado (sem galerias)
- ✅ Apenas 5 usuários do seed
- ✅ Todos os campos obrigatórios preenchidos

---

## 🔓 Destravar Navegador Atlas

### Solução Definitiva:

1. **Fechar todas as abas do Atlas**
2. **Limpar dados**:
   - Menu → Configurações Web → Navegação na Web
   - Excluir Histórico → Todos
   - Confirmar
3. **Abrir nova aba** e acessar `localhost:3000/signin`
4. **Após correções**: Logout agora limpa cookies agressivamente

---

## ✅ Checklist Final

- [ ] Banco resetado (sem galerias)
- [ ] 5 usuários criados pelo seed
- [ ] Login funciona em Safari, Chrome, Atlas
- [ ] Logout não trava (todos os navegadores)
- [ ] Sessão não renova no refresh
- [ ] Tempo mostrado é 10 min para admin
- [ ] Painel admin mostra 5 usuários
- [ ] Edição de usuário carrega dados
- [ ] Placeholders genéricos (não dados do mauriciozanin)
- [ ] Relatórios mostra 30 usuários com buscas
- [ ] CLIENT não pode alterar CPF
- [ ] Certificado A1 validado em criar/editar usuário

---

**Status**: ✅ Todas as correções aplicadas - executar comandos acima para validar

