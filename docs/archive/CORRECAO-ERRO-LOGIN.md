# Correção de Erro de Login

**Erro**: `[SignIn] Erro no login: 'Configuration'`

## 🔍 Causa

O erro "Configuration" do NextAuth v5 geralmente ocorre quando:
1. PrismaAdapter está configurado mas não é necessário com JWT strategy
2. Problema na inicialização do NextAuth

## ✅ Correção Aplicada

1. **Removido PrismaAdapter** - Não é necessário com JWT strategy
2. **Adicionada validação de NEXTAUTH_SECRET** - Garante que está definido

## 🔧 Verificações

### 1. Variáveis de Ambiente

Verifique se `.env.local` tem:
```env
NEXTAUTH_SECRET="[seu_secret_aqui]"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Reiniciar Servidor

Após as correções:
```bash
# Parar servidor (Ctrl+C)
# Limpar cache
rm -rf .next

# Reiniciar
npm run dev
```

### 3. Testar Login

Use as credenciais do seed:
- `admin@tna.studio` / `Admin@2025!`
- `super@tna.studio` / `Super@2025!`
- `model1@tna.studio` / `Model1@2025!`
- `client1@tna.studio` / `Client1@2025!`

## 📝 Arquivos Modificados

- `src/auth.ts` - Removido PrismaAdapter, adicionada validação de secret

## ⚠️ Se o Erro Persistir

1. Verificar logs do servidor (terminal onde `npm run dev` está rodando)
2. Verificar se `.env.local` está sendo carregado
3. Limpar cache: `rm -rf .next node_modules/.cache`
4. Reinstalar dependências: `npm install`

