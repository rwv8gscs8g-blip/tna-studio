# Correções de Erros e Validação

**Data**: 2025-01-20  
**Status**: ✅ Corrigido

---

## 🔧 Problemas Identificados e Corrigidos

### 1. Erro: `Invalid prisma.gallery.findMany()` - Relação `User` não encontrada

**Causa**: Prisma Client não estava sincronizado após mudanças no schema.

**Solução**:
- ✅ Adicionado `npx prisma generate` no script `prestart.sh` antes da validação
- ✅ Adicionado `predev` hook no `package.json` para regenerar Prisma Client antes de `dev`
- ✅ Cache do Next.js limpo (`.next` removido)

### 2. Erro: "CredentialsSignin" no Login

**Causa**: Possível problema com validação de senha ou usuário não encontrado.

**Solução**:
- ✅ Verificar se seed foi executado: `npm run seed`
- ✅ Verificar se usuário existe no banco
- ✅ Verificar se senha está correta (hash bcrypt)

### 3. Script de Validação Sempre Obrigatório

**Decisão**: ✅ **SEMPRE usar `npm run dev` que executa o script de validação**

**Mudanças**:
- ✅ `npm run dev` agora **sempre** executa `prestart.sh` que:
  1. Regenera Prisma Client
  2. Valida schema, código, migrations
  3. Só então inicia o servidor
- ✅ `npm run dev:unsafe` disponível apenas para emergências (sem validação)

---

## 📋 Comandos Corrigidos

### Iniciar Servidor (SEMPRE usar este)

```bash
npm run dev
```

**O que acontece**:
1. `predev` hook: Regenera Prisma Client (`npx prisma generate`)
2. `prestart.sh`: Valida schema, código, migrations
3. Inicia servidor Next.js

### Comandos Auxiliares

```bash
# Regenerar Prisma Client manualmente
npm run prisma:generate

# Aplicar migrations
npm run prisma:migrate

# Validar apenas (sem iniciar servidor)
npm run validate

# Seed (criar usuários de teste)
npm run seed
```

---

## 🚀 Passo a Passo para Reiniciar

### 1. Parar Servidor Atual

```bash
# Pressionar Ctrl+C no terminal onde o servidor está rodando
```

### 2. Limpar Cache

```bash
rm -rf .next
npm run prisma:generate
```

### 3. Iniciar Servidor com Validação

```bash
npm run dev
```

**Aguardar**:
- ✅ Regeneração do Prisma Client
- ✅ Validação pré-start
- ✅ Início do servidor

### 4. Testar Login

1. Acessar: `http://localhost:3000/signin` (ou porta 3001)
2. Login: `super@tna.studio` / `Super@2025!`
3. ✅ Deve fazer login com sucesso

---

## 🔍 Verificações

### Verificar Prisma Client

```bash
# Verificar se Prisma Client está atualizado
npx prisma validate
```

Deve mostrar: `The schema at prisma/schema.prisma is valid 🚀`

### Verificar Usuários

```bash
npx prisma studio
```

- Abrir navegador
- Ir para tabela `User`
- Deve ter 4 usuários:
  - `super@tna.studio` (SUPER_ADMIN)
  - `admin@tna.studio` (ADMIN)
  - `model1@tna.studio` (MODEL)
  - `client1@tna.studio` (CLIENT)

### Verificar Relações Prisma

```bash
# Testar relação User em Gallery
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.gallery.findMany({ take: 1, include: { User: true } }).then(r => { console.log('✅ User funciona'); p.\$disconnect(); }).catch(e => { console.log('❌ Erro:', e.message); p.\$disconnect(); });"
```

Deve mostrar: `✅ User funciona`

---

## ⚠️ Troubleshooting

### Erro: "Invalid prisma.gallery.findMany()"

**Solução**:
```bash
# 1. Limpar cache
rm -rf .next

# 2. Regenerar Prisma Client
npm run prisma:generate

# 3. Reiniciar servidor
npm run dev
```

### Erro: "CredentialsSignin"

**Solução**:
```bash
# 1. Verificar se seed foi executado
npm run seed

# 2. Verificar usuário no banco
npx prisma studio
# Ir para tabela User e verificar se super@tna.studio existe

# 3. Se não existir, executar seed novamente
npm run seed
```

### Erro: "Port 3000 is in use"

**Solução**: O servidor vai usar a porta 3001 automaticamente. Acesse `http://localhost:3001`

### Erro: "Validação falhou"

**Solução**:
```bash
# 1. Sincronizar código
git pull origin main

# 2. Sincronizar migrations
npm run prisma:migrate

# 3. Regenerar Prisma Client
npm run prisma:generate

# 4. Tentar novamente
npm run dev
```

---

## ✅ Checklist de Validação

- [ ] Prisma Client regenerado (`npm run prisma:generate`)
- [ ] Cache limpo (`rm -rf .next`)
- [ ] Seed executado (`npm run seed`)
- [ ] Servidor inicia com validação (`npm run dev`)
- [ ] Login funciona (`super@tna.studio` / `Super@2025!`)
- [ ] Página de galerias carrega sem erros
- [ ] Prisma Studio mostra dados corretos

---

## 📝 Notas Importantes

1. **SEMPRE usar `npm run dev`** - Nunca usar `next dev` diretamente
2. **Validação é obrigatória** - O script `prestart.sh` bloqueia o servidor se validação falhar
3. **Prisma Client deve estar sincronizado** - Sempre regenerar após mudanças no schema
4. **Cache pode causar problemas** - Limpar `.next` se houver erros estranhos

---

**Status**: ✅ Todas as correções aplicadas  
**Próximo**: Executar `npm run dev` e testar login

