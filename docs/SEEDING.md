# Documentação de Seeding - TNA Studio

## Visão Geral

O seed do TNA Studio popula o banco de dados com dados iniciais essenciais para desenvolvimento e testes.

## Como Executar

### Método 1: Via Prisma Migrate Reset (Recomendado)

```bash
# Reseta o banco completamente e roda o seed automaticamente
npx prisma migrate reset
```

**O que faz:**
- Apaga todas as tabelas
- Aplica todas as migrations
- Roda o seed automaticamente

### Método 2: Via Comando Direto

```bash
# Apenas roda o seed (requer que as migrations já estejam aplicadas)
npm run seed
# ou
npx prisma db seed
```

## Dados Criados

### Usuários Padrão

O seed cria 5 usuários obrigatórios:

| Email | Senha | Role | Descrição |
|-------|-------|------|-----------|
| `arquiteto@tna.studio` | `Arquiteto@2025!` | ARQUITETO | Administrador principal (CRUD completo) |
| `admin@tna.studio` | `Admin@2025!` | ADMIN | Administrador (somente leitura) |
| `modelo@tna.studio` | `Modelo@2025!` | MODELO | Modelo (acesso restrito aos próprios dados) |
| `cliente@tna.studio` | `Cliente@2025!` | CLIENTE | Cliente (acesso restrito aos próprios dados) |
| `superadmin@tna.studio` | `SuperAdmin@2025!` | SUPERADMIN | Super Admin (reservado para gestão de certificado) |

### Produtos Oficiais

O seed cria 11 produtos fotográficos:

1. **Pacote 1 - Ensaio Básico** (€500) - Serviço
2. **Pacote 2 - Ensaio Completo** (€900) - Serviço
3. **Pacote 3 - Ensaio Premium** (€1500) - Serviço
4. **Pacote 4 - Ensaio Fashion** (€1800) - Book
5. **Pacote 5 - Ensaio Boudoir** (€2000) - Serviço
6. **Pacote 6 - Ensaio Externo** (€2200) - Serviço
7. **Pacote 7 - Ensaio Corporativo** (€1200) - Serviço
8. **Pacote 8 - Ensaio Artístico** (€2500) - Book
9. **Pacote 9 - Ensaio VIP** (€3500) - Book
10. **Pacote 10 - TFP / Permuta** (Cortesia) - Cortesia
11. **Pacote 11 - Ensaio Personalizado** (A definir) - Serviço

### AppConfig

Cria/atualiza o registro singleton de configuração do sistema:
- `id: "singleton"`
- `productionWriteEnabled: true`
- `preStartValidationEnabled: true`

## Validações Automáticas

O seed valida automaticamente:

- ✅ Pelo menos 4 usuários criados
- ✅ Pelo menos 10 produtos criados
- ✅ AppConfig singleton existe
- ✅ Hash da senha do ARQUITETO está correto (validação via bcrypt.compare)

Se alguma validação falhar, o seed interrompe a execução com código de erro.

## Teste de Integridade

Após rodar o seed, você pode validar a integridade do banco:

```bash
tsx scripts/test-db-integrity.ts
```

Este script verifica:
- Contagem de usuários (>= 4)
- Contagem de produtos (>= 10)
- Existência do AppConfig
- Existência dos usuários obrigatórios

## Troubleshooting

### Erro: "NODE_ENV is production"

O seed bloqueia execução em produção. Para forçar (não recomendado):

```bash
NODE_ENV=development npm run seed
```

### Erro: "Unique constraint failed"

O seed usa `upsert`, então pode rodar múltiplas vezes sem problemas. Se o erro persistir:

1. Limpe as tabelas manualmente no Prisma Studio
2. Rode o seed novamente

### Erro: "Table does not exist"

As migrations devem ser aplicadas antes do seed:

```bash
npx prisma migrate deploy
npm run seed
```

### Erro: "Hash da senha está inválido"

Isso indica problema na geração do hash. Verifique:
- Versão do `bcryptjs` está atualizada
- O seed está usando `bcrypt.hash(password, 12)`

## Segurança

⚠️ **IMPORTANTE:** O seed NUNCA deve rodar em produção. Ele:
- Cria senhas conhecidas
- Expõe dados de teste
- Pode sobrescrever dados reais

O seed tem proteção automática que bloqueia execução se `NODE_ENV === "production"`.

## Estrutura do Seed

```
prisma/seed.ts
├── ensureNotProduction() - Proteção contra execução em produção
├── generateSlug() - Gera slugs a partir de nomes
├── validatePasswordHash() - Valida hash de senha
└── main()
    ├── 1. Criar usuários obrigatórios
    ├── 2. Criar/atualizar AppConfig
    ├── 3. Criar produtos oficiais (11 itens)
    ├── 4. Validação de sucesso
    └── 5. Resumo final
```

## Logs de Saída

O seed produz logs detalhados:

```
🌱 Iniciando seed do banco de dados...
📋 Criando usuários e produtos obrigatórios

✅ ARQUITETO criado: arquiteto@tna.studio
   Senha: Arquiteto@2025! (hash validado: ✓)
   ID: clx...

✅ ADMIN criado: admin@tna.studio
   Senha: Admin@2025! (hash validado: ✓)
   ID: clx...

📦 Criando produtos fotográficos (11 itens)...
   ✓ Pacote 1 - Ensaio Básico (slug: pacote-1-ensaio-basico)
   ...

🔍 Validando integridade do banco...
✅ Validação concluída:
   Usuários: 5
   Produtos: 11
   AppConfig: OK
   Login Arquiteto: OK (Validado via script)

✅ SEED CONCLUÍDO COM SUCESSO
```

## Próximos Passos

Após rodar o seed com sucesso:

1. Teste o login com `arquiteto@tna.studio` / `Arquiteto@2025!`
2. Acesse `/loja` e verifique se os produtos aparecem
3. Execute `tsx scripts/test-db-integrity.ts` para validar

