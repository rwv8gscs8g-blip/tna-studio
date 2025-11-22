# Comandos para Validação do Banco de Dados

## ✅ Comandos Executados

```bash
# 1. Navegar para o diretório do projeto
cd /Users/macbookpro/Projetos/tna-studio

# 2. Aplicar migrations
npx prisma migrate deploy
# Resultado: ✅ Nenhuma migration pendente

# 3. Gerar Prisma Client
npx prisma generate
# Resultado: ✅ Prisma Client gerado

# 4. Validar pré-start
npm run validate
# Resultado: ✅ Validação passou
```

## 🔍 Verificar Sincronização do Banco

### Opção 1: Via Prisma Studio (Interface Gráfica)

```bash
cd /Users/macbookpro/Projetos/tna-studio
npx prisma studio
```

Acesse: http://localhost:5555

Verifique:
- Tabela `User` - Quantos usuários existem?
- Tabela `Gallery` - Quantas galerias existem?
- Compare com o que aparece em produção

### Opção 2: Via SQL Direto

```bash
cd /Users/macbookpro/Projetos/tna-studio
npx prisma db execute --stdin
```

Depois execute:
```sql
-- Contar usuários
SELECT COUNT(*) as total_usuarios FROM "User";

-- Contar galerias
SELECT COUNT(*) as total_galerias FROM "Gallery";

-- Listar galerias do admin
SELECT g.id, g.title, g."userId", u.email 
FROM "Gallery" g 
LEFT JOIN "User" u ON g."userId" = u.id 
WHERE u.email = 'admin@tna.studio';

-- Verificar CPFs
SELECT id, email, cpf FROM "User" WHERE cpf IS NOT NULL;
```

### Opção 3: Via Script Node

Crie um arquivo temporário `check-db.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.count();
  const galleries = await prisma.gallery.count();
  const adminGalleries = await prisma.gallery.findMany({
    where: { User: { email: 'admin@tna.studio' } },
    include: { User: { select: { email: true } } }
  });
  
  console.log(`Total de usuários: ${users}`);
  console.log(`Total de galerias: ${galleries}`);
  console.log(`Galerias do admin: ${adminGalleries.length}`);
  adminGalleries.forEach(g => {
    console.log(`  - ${g.title} (${g.id})`);
  });
  
  await prisma.$disconnect();
}

check();
```

Execute:
```bash
node check-db.js
```

## ✅ Validação Final

Após verificar, confirme:

- [ ] `DATABASE_URL` em `.env.local` é idêntico ao da Vercel
- [ ] Migrations aplicadas (`npx prisma migrate deploy`)
- [ ] Prisma Client gerado (`npx prisma generate`)
- [ ] Validação passou (`npm run validate`)
- [ ] Galerias do admin aparecem em ambos ambientes

## 🚀 Próximo Passo

Se tudo estiver OK, podemos seguir para desenvolvimento das demais funcionalidades!

