# ✅ Comandos de Validação - Corrigidos

**Status**: ✅ Schema corrigido, build passando, seed funcionando

---

## 📋 Comandos Executados (Já Feitos)

✅ Schema Prisma corrigido (adicionado `@default(cuid())` e `@updatedAt`)  
✅ Prisma Client regenerado  
✅ Seed executado com sucesso  
✅ Build passando sem erros  

---

## 🚀 Próximos Passos para Validação

### 1. Iniciar Servidor

```bash
npm run dev
```

**Aguardar**: Servidor deve iniciar na porta 3000 (ou 3001 se 3000 estiver ocupada)

### 2. Testar Login

1. **Acessar**: `http://localhost:3000/signin` (ou `http://localhost:3001/signin`)

2. **Login SUPER_ADMIN**:
   - Email: `super@tna.studio`
   - Senha: `Super@2025!`
   - ✅ Deve fazer login e redirecionar para `/`

3. **Verificar sessão**:
   - Deve ver "Sessão expira em XX:XX" no topo
   - Deve ver email "super@tna.studio"
   - Deve ver botão "Sair"

### 3. Testar Certificado A1

1. **Acessar**: `http://localhost:3000/security/test-a1` (ou porta 3001)

2. **Clicar em "Testar Certificado A1"**

3. **Verificar resultado**:
   - ✅ Deve mostrar "Certificado Válido" (verde)
   - ✅ Deve mostrar dados do certificado (subject, issuer, serial, datas)
   - ✅ Deve mostrar "Assinatura de teste executada e validada com sucesso"

### 4. Testar Criação de Galeria

1. **Login como ADMIN** (`admin@tna.studio` / `Admin@2025!`)

2. **Acessar**: `http://localhost:3000/galleries`

3. **Criar nova galeria**:
   - Título: "Teste Galeria A1"
   - Descrição: "Teste com Certificado A1 obrigatório"
   - Clicar em criar

4. **Verificar sucesso**:
   - ✅ Deve criar galeria com sucesso
   - ✅ Deve aparecer na lista de galerias

### 5. Verificar AdminOperation

```bash
npx prisma studio
```

- Abrir navegador (Prisma Studio abre automaticamente)
- Ir para tabela `AdminOperation`
- Deve ter registro com:
  - `operationType`: "create_gallery"
  - `certificateSerial`: serial do certificado
  - `signatureHash`: hash da assinatura
  - `success`: true

---

## 🔍 Verificações Adicionais

### Verificar Usuários Criados

```bash
npx prisma studio
```

- Ir para tabela `User`
- Deve ter 4 usuários:
  - `super@tna.studio` (SUPER_ADMIN)
  - `admin@tna.studio` (ADMIN)
  - `model1@tna.studio` (MODEL)
  - `client1@tna.studio` (CLIENT)

### Verificar AppConfig

```bash
npx prisma studio
```

- Ir para tabela `AppConfig`
- Deve ter registro com `id: "singleton"`
- Deve ter `authorizedCodeVersion`, `authorizedSchemaVersion`, etc.

---

## 🐛 Troubleshooting

### Erro: "Port 3000 is in use"

**Solução**: O servidor vai usar a porta 3001 automaticamente. Acesse `http://localhost:3001`

### Erro: "Email ou senha incorretos"

**Solução**: 
1. Verificar se seed foi executado: `npm run seed`
2. Verificar se usuário existe no banco: `npx prisma studio`

### Erro: "Certificado A1 inválido"

**Solução**:
1. Verificar se certificado existe: `ls -la secrets/certs/assinatura_a1.pfx`
2. Verificar senha no `.env.local`: `CERT_A1_PASSWORD`
3. Verificar caminho no `.env.local`: `CERT_A1_FILE_PATH`

### Erro: "Operação bloqueada"

**Solução**:
1. Verificar se `CERT_A1_ENFORCE_WRITES=true` no `.env.local`
2. Verificar se certificado está válido (testar em `/security/test-a1`)
3. Verificar logs do servidor para detalhes do bloqueio

---

## ✅ Checklist Final

- [ ] Servidor inicia sem erros
- [ ] Login SUPER_ADMIN funciona
- [ ] Login ADMIN funciona
- [ ] Login MODEL funciona
- [ ] Login CLIENT funciona
- [ ] Página de teste A1 acessível
- [ ] Certificado A1 validado com sucesso
- [ ] Criação de galeria funciona (com certificado)
- [ ] AdminOperation registra operações
- [ ] Prisma Studio mostra dados corretos

---

**Status**: ✅ Pronto para Validação  
**Última atualização**: 2025-01-20

