# Guia de Validação Completa - Modo Real

**Data**: 2025-01-20  
**Status**: ✅ Pronto para Validação

---

## 📋 Passo a Passo Completo

### Passo 1: Criar .env.local

```bash
# Copiar template (agora o arquivo existe)
cp .env.local.example .env.local
```

**Verificar se funcionou:**
```bash
ls -la .env.local
```

### Passo 2: Editar .env.local

Abra o arquivo `.env.local` e preencha as variáveis obrigatórias:

```bash
# Usar seu editor preferido
nano .env.local
# ou
code .env.local
# ou
open -a TextEdit .env.local
```

**Variáveis OBRIGATÓRIAS a preencher:**

1. **DATABASE_URL** - URL do banco Neon (ex: `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require`)
2. **DIRECT_URL** - Mesma URL do banco Neon
3. **NEXTAUTH_SECRET** - Gerar com: `openssl rand -base64 32`
4. **CERT_A1_FILE_PATH** - Caminho do certificado (ex: `./secrets/certs/assinatura_a1.pfx`)
5. **CERT_A1_PASSWORD** - Senha do certificado
6. **CERT_A1_ENFORCE_WRITES** - Deixar como `true`

**Gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

Copie o resultado e cole no `.env.local` como valor de `NEXTAUTH_SECRET`.

### Passo 3: Verificar Certificado A1

```bash
# Verificar se certificado existe
ls -la secrets/certs/assinatura_a1.pfx
```

Se não existir, coloque o certificado no lugar:
```bash
# Criar diretório se não existir
mkdir -p secrets/certs

# Copiar certificado (ajuste o caminho)
cp /caminho/do/seu/certificado.pfx ./secrets/certs/assinatura_a1.pfx
```

### Passo 4: Aplicar Migrations

```bash
# Aplicar migrations no banco
npx prisma migrate deploy

# Se der erro, tentar:
npx prisma migrate dev
```

**Verificar se funcionou:**
```bash
npx prisma migrate status
```

Deve mostrar: "Database schema is up to date!"

### Passo 5: Gerar Prisma Client

```bash
npx prisma generate
```

**Verificar se funcionou:**
```bash
# Não deve dar erro
echo "Prisma Client gerado"
```

### Passo 6: Criar Usuários de Teste

```bash
npm run seed
```

**Verificar se funcionou:**
Deve mostrar:
```
✅ super@tna.studio (SUPER_ADMIN) pronto. Senha padrão: Super@2025!
✅ admin@tna.studio (ADMIN) pronto. Senha padrão: Admin@2025!
✅ model1@tna.studio (MODEL) pronto. Senha padrão: Model1@2025!
✅ client1@tna.studio (CLIENT) pronto. Senha padrão: Client1@2025!
```

### Passo 7: Validar Pré-Start

```bash
# Executar validação manual
npm run validate
```

**Verificar:**
- Deve mostrar "✅ Todas as validações passaram!" ou avisos (pode ser normal na primeira execução)

### Passo 8: Limpar Cache e Buildar

```bash
# Limpar cache
rm -rf .next

# Buildar para verificar erros
npm run build
```

**Verificar:**
- Deve compilar sem erros
- Se houver erros, corrigir antes de continuar

### Passo 9: Iniciar Servidor

```bash
npm run dev
```

**Verificar:**
- Servidor deve iniciar na porta 3000
- Não deve haver erros críticos no console

### Passo 10: Testar Login

1. **Acessar**: `http://localhost:3000/signin`

2. **Login SUPER_ADMIN**:
   - Email: `super@tna.studio`
   - Senha: `Super@2025!`
   - ✅ Deve fazer login e redirecionar para `/`

3. **Verificar sessão**:
   - Deve ver "Sessão expira em XX:XX" no topo
   - Deve ver email "super@tna.studio"
   - Deve ver botão "Sair"

4. **Logout e Login ADMIN**:
   - Clicar em "Sair"
   - Login: `admin@tna.studio` / `Admin@2025!`
   - ✅ Deve fazer login com sucesso

### Passo 11: Testar Certificado A1 (Página de Teste)

1. **Login como ADMIN** (`admin@tna.studio`)

2. **Acessar**: `http://localhost:3000/security/test-a1`

3. **Clicar em "Testar Certificado A1"**

4. **Verificar resultado**:
   - ✅ Deve mostrar "Certificado Válido" (verde)
   - ✅ Deve mostrar dados do certificado (subject, issuer, serial, datas)
   - ✅ Deve mostrar "Assinatura de teste executada e validada com sucesso"
   - ✅ Não deve ter "issues" (ou issues devem ser apenas avisos)

### Passo 12: Testar Criação de Galeria com A1 OK

1. **Login como ADMIN** (`admin@tna.studio`)

2. **Acessar**: `http://localhost:3000/galleries`

3. **Criar nova galeria**:
   - Título: "Teste Galeria A1"
   - Descrição: "Teste com Certificado A1 obrigatório"
   - Clicar em criar

4. **Verificar sucesso**:
   - ✅ Deve criar galeria com sucesso
   - ✅ Deve aparecer na lista de galerias

5. **Verificar AdminOperation**:
   ```bash
   npx prisma studio
   ```
   - Abrir navegador (Prisma Studio)
   - Ir para tabela `AdminOperation`
   - Deve ter registro com:
     - `operationType`: "create_gallery"
     - `certificateSerial`: serial do certificado
     - `signatureHash`: hash da assinatura
     - `success`: true

### Passo 13: Testar Bloqueio sem Certificado

1. **Renomear certificado** (simular perda):
   ```bash
   mv secrets/certs/assinatura_a1.pfx secrets/certs/assinatura_a1.pfx.backup
   ```

2. **Reiniciar servidor**:
   ```bash
   # Parar servidor (Ctrl+C)
   npm run dev
   ```

3. **Tentar criar galeria**:
   - Login como ADMIN
   - Acessar `/galleries`
   - Tentar criar nova galeria

4. **Verificar bloqueio**:
   - ✅ Deve retornar erro 403
   - ✅ Mensagem: "Certificado A1 inválido: Arquivo não encontrado"
   - ✅ Operação não deve ser executada

5. **Verificar AdminOperation**:
   ```bash
   npx prisma studio
   ```
   - Verificar tabela `AdminOperation`
   - Deve ter registro com:
     - `operationType`: "blocked_create_gallery"
     - `success`: false
     - `errorMessage`: contém "Arquivo não encontrado"

6. **Restaurar certificado**:
   ```bash
   mv secrets/certs/assinatura_a1.pfx.backup secrets/certs/assinatura_a1.pfx
   ```

7. **Reiniciar servidor e testar novamente**:
   - ✅ Deve funcionar normalmente

### Passo 14: Testar Bloqueio com Senha Errada

1. **Alterar senha no .env.local**:
   ```bash
   # Editar .env.local
   nano .env.local
   # Alterar CERT_A1_PASSWORD para senha errada
   ```

2. **Reiniciar servidor**:
   ```bash
   # Parar (Ctrl+C)
   npm run dev
   ```

3. **Tentar criar galeria**:
   - ✅ Deve retornar erro 403
   - ✅ Mensagem: "Erro ao descriptografar certificado. Senha incorreta"

4. **Restaurar senha correta** e reiniciar

### Passo 15: Testar Backup Lógico

```bash
# Executar backup
chmod +x scripts/backup/backup-logico.sh
./scripts/backup/backup-logico.sh
```

**Verificar:**
- ✅ Deve criar arquivo em `./backups/tna-studio-backup-YYYYMMDD_HHMMSS.sql`
- ✅ Deve criar checksum `.sha256`
- ✅ Deve mostrar tamanho do backup

---

## ✅ Checklist de Validação

### Configuração

- [ ] `.env.local` criado e preenchido
- [ ] `DATABASE_URL` configurado
- [ ] `NEXTAUTH_SECRET` gerado e configurado
- [ ] `CERT_A1_FILE_PATH` apontando para certificado válido
- [ ] `CERT_A1_PASSWORD` configurado corretamente
- [ ] `CERT_A1_ENFORCE_WRITES=true`

### Banco de Dados

- [ ] Migrations aplicadas (`npx prisma migrate deploy`)
- [ ] Prisma Client gerado (`npx prisma generate`)
- [ ] Seed executado (`npm run seed`)
- [ ] Usuários criados (super, admin, model1, client1)

### Servidor

- [ ] Build passa sem erros (`npm run build`)
- [ ] Servidor inicia (`npm run dev`)
- [ ] Sem erros críticos no console

### Login

- [ ] Login SUPER_ADMIN funciona
- [ ] Login ADMIN funciona
- [ ] Login MODEL funciona
- [ ] Login CLIENT funciona

### Certificado A1

- [ ] Página de teste acessível (`/security/test-a1`)
- [ ] Teste de certificado passa (verde)
- [ ] Dados do certificado exibidos corretamente
- [ ] Assinatura de teste funciona

### Operações com A1

- [ ] Criar galeria funciona (com certificado válido)
- [ ] Criar usuário funciona (com certificado válido)
- [ ] AdminOperation registra operações

### Bloqueio sem A1

- [ ] Remover certificado → operação bloqueada
- [ ] Senha errada → operação bloqueada
- [ ] AdminOperation registra bloqueios

---

## 🚨 Troubleshooting

### Erro: "No such file or directory" ao copiar .env.local.example

**Solução**: O arquivo foi criado agora. Execute novamente:
```bash
cp .env.local.example .env.local
```

### Erro: "Cannot connect to database"

**Solução**:
1. Verificar se `DATABASE_URL` está correto
2. Verificar se banco Neon está acessível
3. Verificar firewall/IP whitelist no Neon

### Erro: "NEXTAUTH_SECRET is missing"

**Solução**:
```bash
# Gerar secret
openssl rand -base64 32

# Adicionar ao .env.local
NEXTAUTH_SECRET="o_secret_gerado"
```

### Erro: "Certificado A1 inválido"

**Solução**:
1. Verificar se `CERT_A1_FILE_PATH` está correto
2. Verificar se arquivo existe: `ls -la secrets/certs/assinatura_a1.pfx`
3. Verificar se `CERT_A1_PASSWORD` está correto

### Erro: "Migration failed"

**Solução**:
```bash
# Verificar status
npx prisma migrate status

# Se necessário, resetar (CUIDADO: apaga dados)
npx prisma migrate reset

# Reaplicar
npx prisma migrate deploy
```

---

**Status**: ✅ Guia Completo Criado  
**Próximo**: Seguir passo a passo acima

