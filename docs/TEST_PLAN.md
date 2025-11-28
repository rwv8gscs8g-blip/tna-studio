# Plano de Testes - TNA Studio V2

## Objetivo

Validar que todas as funcionalidades estão funcionando corretamente e que as permissões de segurança estão implementadas conforme a matriz de roles.

## Ambiente de Teste

- **Banco**: Neon PostgreSQL (DEV)
- **Usuários de teste**:
  - ARQUITETO: `arquiteto@tna.studio` / `Arquiteto@2025!`
  - ADMIN: `admin@tna.studio` / `Admin@2025!`
  - MODELO: `modelo@tna.studio` / `Modelo@2025!`
  - CLIENTE: `cliente@tna.studio` / `Cliente@2025!`

## Bloco 1: Testes de Permissões (CRÍTICO)

### 1.1 ARQUITETO - Operações de Escrita

#### Teste 1.1.1: Criar Usuário
- [ ] Login como ARQUITETO
- [ ] Acessar `/admin/users`
- [ ] Criar novo usuário (MODELO)
- [ ] Verificar se usuário aparece na lista
- [ ] Verificar se foto de perfil pode ser enviada

#### Teste 1.1.2: Editar Usuário
- [ ] Editar usuário existente
- [ ] Alterar nome, email, CPF (com máscara)
- [ ] Alterar foto de perfil
- [ ] Verificar se alterações foram salvas

#### Teste 1.1.3: Criar Produto
- [ ] Acessar `/arquiteto/produtos/novo`
- [ ] Preencher formulário com Rich Text
- [ ] Fazer upload de capa e fotos (até 3)
- [ ] Salvar produto
- [ ] Verificar se aparece na loja

#### Teste 1.1.4: Editar Produto
- [ ] Editar produto existente
- [ ] Alterar descrição (Rich Text)
- [ ] Reordenar produtos (alterar displayOrder)
- [ ] Verificar se ordem foi atualizada na loja

#### Teste 1.1.5: Criar Ensaio
- [ ] Acessar `/arquiteto/ensaios/novo`
- [ ] Preencher dados do ensaio
- [ ] Fazer upload de capa, termo PDF, fotos (até 30)
- [ ] Publicar ensaio
- [ ] Verificar se aparece para MODELO/CLIENTE

#### Teste 1.1.6: Upload Múltiplo de Fotos
- [ ] Acessar edição de ensaio
- [ ] Selecionar múltiplas fotos (até 30)
- [ ] Verificar preview antes do upload
- [ ] Fazer upload e verificar progresso
- [ ] Verificar se todas as fotos foram adicionadas
- [ ] Testar definir foto como capa
- [ ] Testar reordenar fotos

### 1.2 ADMIN - Somente Leitura

#### Teste 1.2.1: Tentativa de Criar Usuário
- [ ] Login como ADMIN
- [ ] Acessar `/admin/users`
- [ ] Verificar que formulário de criação NÃO aparece
- [ ] Verificar banner "Somente leitura"
- [ ] Tentar fazer POST para `/api/admin/users` (deve retornar 403)

#### Teste 1.2.2: Tentativa de Editar Usuário
- [ ] Clicar em "Ver" em um usuário
- [ ] Verificar que botão "Salvar" está desabilitado ou não existe
- [ ] Tentar fazer PATCH para `/api/admin/users/[id]` (deve retornar 403)

#### Teste 1.2.3: Tentativa de Criar Produto
- [ ] Acessar `/arquiteto/produtos`
- [ ] Verificar que botão "Novo Produto" NÃO aparece ou está desabilitado
- [ ] Tentar fazer POST para `/api/produtos` (deve retornar 403)

#### Teste 1.2.4: Tentativa de Upload
- [ ] Tentar fazer upload de foto de perfil (deve retornar 403)
- [ ] Tentar fazer upload de foto de produto (deve retornar 403)
- [ ] Tentar fazer upload de foto de ensaio (deve retornar 403)

#### Teste 1.2.5: Visualização (deve funcionar)
- [ ] Ver lista de usuários
- [ ] Ver detalhes de usuário (incluindo foto de perfil)
- [ ] Ver lista de produtos
- [ ] Ver detalhes de produto
- [ ] Ver lista de ensaios
- [ ] Ver detalhes de ensaio (incluindo fotos)

### 1.3 MODELO - Acesso Restrito

#### Teste 1.3.1: Visualização de Ensaios
- [ ] Login como MODELO
- [ ] Acessar `/modelo/ensaios`
- [ ] Verificar que apenas ensaios próprios (publicados) aparecem
- [ ] Verificar que não pode ver ensaios de outros modelos

#### Teste 1.3.2: Tentativa de Edição
- [ ] Tentar acessar `/arquiteto/ensaios` (deve redirecionar)
- [ ] Tentar fazer PATCH para `/api/arquiteto/ensaios/[id]` (deve retornar 403)
- [ ] Tentar fazer upload de foto (deve retornar 403)

#### Teste 1.3.3: Edição de Próprio Perfil
- [ ] Tentar editar próprio perfil via `/api/profile/update`
- [ ] Verificar que retorna erro (MODELO não pode editar)

#### Teste 1.3.4: Intenções de Compra
- [ ] Acessar `/loja`
- [ ] Ver produto e clicar em "Quero este produto"
- [ ] Verificar que intenção foi criada
- [ ] Verificar que aparece em `/modelo/intencoes`

### 1.4 CLIENTE - Acesso Restrito

#### Teste 1.4.1: Visualização de Ensaios
- [ ] Login como CLIENTE
- [ ] Acessar `/cliente/home`
- [ ] Verificar que apenas ensaios próprios (publicados) aparecem

#### Teste 1.4.2: Edição de Próprio Perfil
- [ ] Tentar editar próprio perfil
- [ ] Verificar que pode editar (exceto CPF)
- [ ] Tentar alterar CPF (deve retornar erro)

## Bloco 2: Testes de Funcionalidades

### 2.1 Máscaras de CPF e CEP

#### Teste 2.1.1: Formatação de CPF
- [ ] Criar/editar usuário
- [ ] Digitar CPF: `12345678901`
- [ ] Verificar que aparece formatado: `123.456.789-01`
- [ ] Verificar que salva apenas números no banco

#### Teste 2.1.2: Formatação de CEP
- [ ] Editar usuário
- [ ] Digitar CEP: `70000000`
- [ ] Verificar que aparece formatado: `70000-000`
- [ ] Verificar que salva apenas números no banco

### 2.2 Rich Text Editor

#### Teste 2.2.1: Editor em Produtos
- [ ] Criar/editar produto
- [ ] Usar Rich Text Editor em "Descrição Completa"
- [ ] Aplicar formatação (negrito, itálico, listas)
- [ ] Salvar produto
- [ ] Verificar se formatação aparece na página do produto

#### Teste 2.2.2: Sanitização de HTML
- [ ] Inserir HTML malicioso: `<script>alert('XSS')</script>`
- [ ] Verificar que script é removido ao salvar
- [ ] Verificar que apenas tags permitidas são mantidas

#### Teste 2.2.3: Editor em Ensaios
- [ ] Editar ensaio
- [ ] Usar Rich Text Editor em "Descrição"
- [ ] Aplicar formatação
- [ ] Salvar e verificar

### 2.3 Ordenação de Produtos

#### Teste 2.3.1: Ordem na Loja
- [ ] Acessar `/loja`
- [ ] Verificar que produtos aparecem na ordem definida (displayOrder)
- [ ] Verificar que ordem é consistente

#### Teste 2.3.2: Reordenação (ARQUITETO)
- [ ] Acessar `/arquiteto/produtos`
- [ ] Alterar ordem de um produto (input numérico)
- [ ] Verificar que ordem foi atualizada
- [ ] Verificar que ordem reflete na loja

### 2.4 Sistema de Álbuns de Ensaio

#### Teste 2.4.1: Upload Múltiplo
- [ ] Acessar edição de ensaio
- [ ] Selecionar 5 fotos simultaneamente
- [ ] Verificar preview de todas
- [ ] Fazer upload
- [ ] Verificar que todas foram adicionadas

#### Teste 2.4.2: Limite de 30 Fotos
- [ ] Adicionar fotos até atingir 30
- [ ] Tentar adicionar mais uma (deve bloquear)
- [ ] Verificar mensagem de limite atingido

#### Teste 2.4.3: Definir Capa
- [ ] Clicar em "Capa" em uma foto
- [ ] Verificar que foto foi definida como capa
- [ ] Verificar que aparece como capa na listagem

#### Teste 2.4.4: Remover Foto
- [ ] Remover foto do álbum
- [ ] Verificar que foi removida
- [ ] Verificar que contador foi atualizado

## Bloco 3: Testes de Segurança

### 3.1 Injeção de HTML

#### Teste 3.1.1: Rich Text XSS
- [ ] Inserir `<script>alert('XSS')</script>` no Rich Text
- [ ] Verificar que script não é executado
- [ ] Verificar que HTML é sanitizado

### 3.2 Upload Não Autorizado

#### Teste 3.2.1: Upload por ADMIN
- [ ] Login como ADMIN
- [ ] Tentar fazer upload via API (deve retornar 403)
- [ ] Verificar logs de auditoria

#### Teste 3.2.2: Upload por MODELO
- [ ] Login como MODELO
- [ ] Tentar fazer upload via API (deve retornar 403)

### 3.3 Acesso a Dados de Outros

#### Teste 3.3.1: MODELO acessando ensaio de outro
- [ ] Login como MODELO
- [ ] Tentar acessar `/ensaios/[id]` onde `subjectCpf !== user.cpf`
- [ ] Verificar que retorna 403

#### Teste 3.3.2: CLIENTE acessando ensaio de outro
- [ ] Login como CLIENTE
- [ ] Tentar acessar ensaio de outro cliente
- [ ] Verificar que retorna 403

## Bloco 4: Testes de Integração

### 4.1 Fluxo Completo ARQUITETO

#### Teste 4.1.1: Criar Ensaio Completo
1. [ ] Criar novo ensaio
2. [ ] Fazer upload de capa
3. [ ] Fazer upload de termo PDF
4. [ ] Fazer upload de 10 fotos
5. [ ] Definir uma foto como capa
6. [ ] Publicar ensaio
7. [ ] Verificar que MODELO pode ver
8. [ ] Verificar que fotos aparecem corretamente

### 4.2 Fluxo MODELO

#### Teste 4.2.1: Visualizar e Solicitar Produto
1. [ ] Login como MODELO
2. [ ] Acessar `/loja`
3. [ ] Ver produto com Rich Text formatado
4. [ ] Clicar em "Quero este produto"
5. [ ] Verificar que intenção foi criada
6. [ ] Verificar que aparece em `/modelo/intencoes`

## Checklist de Validação Final

### Segurança
- [ ] ADMIN não pode fazer nenhuma operação de escrita
- [ ] Todas as rotas de escrita verificam `userRole === Role.ARQUITETO`
- [ ] Uploads são bloqueados para não-ARQUITETO
- [ ] Rich Text é sanitizado antes de salvar

### Funcionalidades
- [ ] Máscaras de CPF/CEP funcionam corretamente
- [ ] Rich Text Editor funciona em produtos e ensaios
- [ ] Ordenação de produtos funciona
- [ ] Upload múltiplo de fotos funciona (até 30)
- [ ] Sistema de álbuns permite definir capa e reordenar

### UI/UX
- [ ] Botões de ação escondidos para ADMIN
- [ ] Banners de "Somente leitura" aparecem para ADMIN
- [ ] Preview de fotos funciona antes do upload
- [ ] Indicadores de progresso funcionam

## Comandos de Execução

```bash
# 1. Aplicar migration
npx prisma migrate dev

# 2. Rodar seed
npm run seed

# 3. Iniciar servidor
npm run dev

# 4. Executar testes manuais conforme checklist acima
```

## Notas

- Todos os testes devem ser executados em ambiente DEV
- Logs de erro devem ser verificados no console do servidor
- Testes de segurança devem validar que erros 403 são retornados corretamente
- Testes de funcionalidade devem validar que dados são salvos e exibidos corretamente

