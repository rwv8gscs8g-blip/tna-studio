# Instruções para Corrigir Erro de Login

## 🔧 Correções Aplicadas

1. ✅ **Removido PrismaAdapter** - Não necessário com JWT strategy
2. ✅ **Adicionada validação de NEXTAUTH_SECRET** - Garante que está definido
3. ✅ **Adicionado tratamento de erro na inicialização** - Melhor diagnóstico

## 🚀 Próximos Passos

### 1. Parar o Servidor

Se o servidor estiver rodando, pare com `Ctrl+C` no terminal onde `npm run dev` está executando.

### 2. Limpar Cache

```bash
cd /Users/macbookpro/Projetos/tna-studio
rm -rf .next
rm -rf node_modules/.cache
```

### 3. Reiniciar Servidor

```bash
npm run dev
```

### 4. Testar Login

Acesse: http://localhost:3000/signin

**Credenciais de teste**:
- `admin@tna.studio` / `Admin@2025!`
- `super@tna.studio` / `Super@2025!`
- `model1@tna.studio` / `Model1@2025!`
- `client1@tna.studio` / `Client1@2025!`

## 🔍 Se o Erro Persistir

### Verificar Logs do Servidor

No terminal onde `npm run dev` está rodando, procure por:
- `❌ NEXTAUTH_SECRET não está definido` - Secret faltando
- `❌ Erro ao inicializar NextAuth` - Problema na configuração
- Outros erros relacionados

### Verificar Variáveis de Ambiente

```bash
# Verificar se .env.local existe e tem as variáveis
cat .env.local | grep NEXTAUTH
```

Deve mostrar:
```
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

### Verificar Prisma

```bash
# Verificar se Prisma Client está atualizado
npx prisma generate

# Verificar conexão com banco
npx prisma db pull
```

## 📝 Arquivos Modificados

- `src/auth.ts`:
  - Removido PrismaAdapter
  - Adicionada validação de NEXTAUTH_SECRET
  - Adicionado tratamento de erro na inicialização

## ✅ Checklist

- [ ] Servidor parado
- [ ] Cache limpo (`.next` e `node_modules/.cache`)
- [ ] Servidor reiniciado (`npm run dev`)
- [ ] Login testado com credenciais do seed
- [ ] Se erro persistir, verificar logs do servidor

---

**Após reiniciar, teste o login e me avise se funcionou!**

