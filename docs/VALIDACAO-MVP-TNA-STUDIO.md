# Validação MVP TNA Studio

Checklist de testes de regressão para o MVP 1.0.

## 🔐 Testes de Login

### Login por Role

- [ ] **ARQUITETO**: Login redireciona para `/arquiteto/relatorios`
- [ ] **ADMIN**: Login redireciona para `/admin/relatorios`
- [ ] **MODELO**: Login redireciona para `/modelo/home`
- [ ] **CLIENTE**: Login redireciona para `/modelo/home`
- [ ] **SUPERADMIN**: Login redireciona para `/superadmin/certificado`

### Validação de Sessão

- [ ] Sessão expira corretamente (ARQUITETO: 60min, ADMIN: 30min, MODELO/CLIENTE: 10min)
- [ ] Logout limpa cookies e tokens
- [ ] Acesso negado sem autenticação

## 📊 Testes de Páginas Principais

### Relatórios

- [ ] `/arquiteto/relatorios` carrega sem erro de enum
- [ ] `/admin/relatorios` carrega sem erro de enum
- [ ] Estatísticas exibidas corretamente (total de ensaios, modelos, projetos, produtos)
- [ ] Contagem de ensaios por status (PUBLISHED, DRAFT, DELETED) funciona

### Ensaios

- [ ] `/arquiteto/ensaios` carrega sem erro de enum
- [ ] Listagem exibe ensaios corretamente (grid 3 colunas)
- [ ] Filtros funcionam (por modelo, projeto, produto, status, data)
- [ ] Paginação funciona (50 por página)
- [ ] Estado vazio exibido quando não há ensaios
- [ ] `/modelo/ensaios` exibe apenas ensaios PUBLISHED
- [ ] MODELO/CLIENTE não vê ensaios DELETED

### Avisos

- [ ] `/avisos` carrega sem erro de enum
- [ ] ARQUITETO vê avisos de solicitações pendentes e ensaios deletados
- [ ] ADMIN vê avisos de ensaios deletados (somente leitura)
- [ ] Estado vazio exibido quando não há avisos

## ✏️ Testes de Criação e Edição

### Criação de Ensaio (ARQUITETO)

- [ ] Acessar `/arquiteto/ensaios/new`
- [ ] Busca de modelo/cliente funciona (por nome, email ou CPF)
- [ ] Seleção de data do ensaio funciona
- [ ] Preenchimento de título funciona
- [ ] Multi-select de projetos funciona
- [ ] Multi-select de produtos funciona
- [ ] Upload de capa funciona (até 10MB, jpg/jpeg/png/webp)
- [ ] Upload de termo PDF funciona (até 10MB)
- [ ] Upload de mini-galeria funciona (até 5 fotos, 10MB cada)
- [ ] Configuração de link Sync.com funciona
- [ ] Salvar redireciona para detalhe do ensaio
- [ ] Ensaio criado com status correto (DRAFT ou PUBLISHED)

### Edição de Ensaio (ARQUITETO)

- [ ] Acessar `/arquiteto/ensaios/[id]/edit`
- [ ] Dados carregados corretamente
- [ ] Edição de campos funciona
- [ ] Mudança de status funciona (DRAFT, PUBLISHED, DELETED)
- [ ] Salvar atualiza ensaio corretamente

### Deleção de Ensaio (ARQUITETO)

- [ ] Marcar ensaio como DELETED funciona
- [ ] Ensaio DELETED não aparece para MODELO/CLIENTE
- [ ] Limpeza definitiva funciona (`/api/arquiteto/ensaios/limpar-deletados`)
- [ ] Apenas ensaios deletados há mais de 7 dias são limpos
- [ ] Arquivos do R2 são removidos na limpeza

## 📝 Testes de Solicitação de Alteração de Dados

### Solicitação (MODELO/CLIENTE)

- [ ] Acessar `/modelo/solicitar-alteracao`
- [ ] Formulário exibe campos permitidos
- [ ] CPF não aparece como campo editável
- [ ] Submissão cria `ModelChangeRequest` com status PENDING
- [ ] Mensagem de sucesso exibida após submissão
- [ ] Histórico de solicitações exibido corretamente

### Aprovação/Rejeição (ARQUITETO)

- [ ] Acessar `/arquiteto/solicitacoes`
- [ ] Lista de solicitações PENDING exibida
- [ ] Aprovar atualiza dados do usuário
- [ ] Aprovar cria registro em `ModelAuditHistory`
- [ ] Rejeitar atualiza status para REJECTED
- [ ] Rejeitar salva motivo da rejeição
- [ ] MODELO/CLIENTE vê status atualizado em seu histórico

## 🛒 Testes de Loja

### Visualização (MODELO/CLIENTE)

- [ ] Acessar `/loja`
- [ ] Lista de produtos exibida corretamente
- [ ] Detalhes do produto exibidos corretamente
- [ ] Fotos do produto carregam via URLs assinadas
- [ ] Criar intenção de compra funciona

### CRUD (ARQUITETO)

- [ ] Criar produto funciona
- [ ] Editar produto funciona
- [ ] Deletar produto funciona
- [ ] Upload de fotos funciona (até 5 fotos por produto)
- [ ] ADMIN tem somente leitura

## 📁 Testes de Contratos

### Visualização (MODELO/CLIENTE)

- [ ] Acessar `/modelo/contratos`
- [ ] Lista de contratos exibida (ensaios com `termPdfKey`)
- [ ] Cada contrato mostra: data do ensaio, capa, botão de download
- [ ] Download gera URL efêmera corretamente
- [ ] URL expira após 60-120 segundos

## 🔗 Testes de URLs Seguras

### Sync.com Encapsulado

- [ ] Acessar `/secure/sync/[id]` valida sessão/role
- [ ] Conteúdo carregado em iframe com sandbox
- [ ] Link nunca exposto diretamente em JSON ou HTML
- [ ] Acesso negado sem autenticação

### URLs Assinadas R2

- [ ] URLs de capa geradas corretamente (`/api/ensaios/[id]/cover`)
- [ ] URLs de termo geradas corretamente (`/api/ensaios/[id]/term`)
- [ ] URLs expiram após 60-120 segundos
- [ ] Validação de sessão antes de gerar URL
- [ ] Headers corretos (`Cache-Control: no-store, private`)

## 🧭 Testes de Navegação

### Menu por Role

- [ ] **ARQUITETO**: Relatórios, Ensaios, Criar Ensaio, Loja, Projetos, Solicitações, Avisos, Perfil, Sair
- [ ] **ADMIN**: Relatórios, Avisos, Perfil, Sair (sem duplicação)
- [ ] **MODELO**: Home, Meus Ensaios, Loja, Projetos, Meus Contratos, Solicitar Alteração, Perfil, Sair
- [ ] Item ativo destacado corretamente (cinza médio)

## 🔒 Testes de Permissões

### ARQUITETO

- [ ] Pode criar/editar/deletar ensaios
- [ ] Pode aprovar/rejeitar solicitações de alteração
- [ ] Pode criar/editar/deletar produtos
- [ ] Pode criar/editar/deletar projetos
- [ ] Pode limpar ensaios deletados

### ADMIN

- [ ] Não pode criar/editar ensaios (somente leitura)
- [ ] Não pode aprovar solicitações
- [ ] Não pode criar/editar produtos
- [ ] Pode visualizar relatórios e avisos

### MODELO/CLIENTE

- [ ] Não pode criar ensaios
- [ ] Não pode editar dados diretamente
- [ ] Pode solicitar alterações de dados
- [ ] Pode visualizar seus ensaios publicados
- [ ] Pode baixar contratos
- [ ] Pode acessar loja e criar intenções de compra

## 📱 Testes de Mensagens

### Padronização

- [ ] Todas as mensagens de permissão mencionam "responsável pelo sistema" (não "Arquiteto")
- [ ] Mensagens de erro são amigáveis
- [ ] Estados vazios exibidos corretamente
- [ ] Mensagens de sucesso/erro aparecem após ações

## 🐛 Testes de Tratamento de Erro

### Páginas com Try/Catch

- [ ] `/arquiteto/relatorios` mostra mensagem amigável em caso de erro
- [ ] `/arquiteto/ensaios` mostra mensagem amigável em caso de erro
- [ ] `/avisos` mostra mensagem amigável em caso de erro
- [ ] Links de navegação sempre visíveis mesmo em erro
- [ ] Navegação superior sempre funcional

## ✅ Validação Final

### Checklist Completo

- [ ] Todos os testes de login passam
- [ ] Todas as páginas principais carregam sem erro
- [ ] Criação/edição/deleção de ensaios funciona
- [ ] Sistema de solicitações funciona end-to-end
- [ ] Loja funciona para todos os roles
- [ ] Contratos funcionam corretamente
- [ ] URLs seguras funcionam
- [ ] Permissões respeitadas
- [ ] Mensagens padronizadas
- [ ] Tratamento de erro funciona

---

**Versão**: 1.0.0
**Última atualização**: 2025-01-25

