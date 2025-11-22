# Instruções de Setup - Arquitetura ARQUITETO

**Data:** 2025-11-21

## IMPORTANTE: Regenerar Prisma Client

Após aplicar a migration que adiciona o role `ARQUITETO`, você **DEVE** regenerar o Prisma Client:

```bash
npx prisma generate
```

Sem isso, o TypeScript não reconhecerá `Role.ARQUITETO` e você verá erros de compilação.

## Passos Completos de Setup

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie `.env.local` com:
```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
CERT_A1_FILE_PATH="./secrets/certs/assinatura_a1.pfx"  # Opcional
CERT_A1_PASSWORD="senha_do_certificado"                # Opcional
CERT_A1_ENFORCE_WRITES="false"                         # Opcional
```

### 3. Aplicar Migrations e Gerar Prisma Client
```bash
# Aplicar migrations
npx prisma migrate deploy

# OU se estiver em desenvolvimento:
npx prisma migrate dev

# Gerar Prisma Client (OBRIGATÓRIO após migration)
npx prisma generate
```

### 4. Rodar Seed
```bash
npm run seed
```

Isso criará apenas o primeiro ARQUITETO:
- Email: `[redacted-email]`
- Senha: `[redacted-password]`

### 5. Iniciar Servidor
```bash
npm run dev
```

### 6. Fazer Login
- Acesse `http://localhost:3000/signin`
- Use as credenciais do ARQUITETO criado no seed

## Script de Reset Completo

Para resetar tudo e começar do zero:

```bash
./scripts/reset-database-zerar-tudo.sh
```

Este script:
1. Reseta o banco de dados
2. Aplica todas as migrations
3. Gera o Prisma Client
4. Roda o seed (cria apenas o ARQUITETO)

## Resolver Problemas

### Erro: "Property 'ARQUITETO' does not exist on type Role"
**Solução:** Execute `npx prisma generate` para regenerar o Prisma Client.

### Erro: "Cannot find module '@prisma/client'"
**Solução:** Execute `npm install` novamente.

### Erro de migration
**Solução:** Execute `npx prisma migrate reset --force` e depois `npx prisma migrate deploy`.

### Login não funciona
**Solução:** 
1. Verifique se o seed foi executado: `npm run seed`
2. Verifique se as variáveis de ambiente estão corretas
3. Verifique os logs do servidor para erros

## Próximos Passos

Após o setup completo:
1. Teste login como ARQUITETO
2. Teste criação de galeria
3. Teste upload de fotos
4. Verifique que ADMIN/SUPER_ADMIN veem dados mas não editam
5. Verifique que MODEL/CLIENT veem apenas seus próprios dados

Consulte `CHECKLIST-MVP-ARQUITETO.md` para validação completa.

